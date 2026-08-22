from collections import defaultdict
from typing import List, Optional

from src.infrastructure.models import User

from ...domain.schemas import (
    EvaluatorMetric,
    HeuristicBreakdown,
    IssueItem,
    ProjectAnalyticsResponse,
    ProjectAnalyticsSummary,
    ProjectInfo,
    ProjectSummaryCard,
    SeverityCounts,
    TimelinePoint,
)
from ...infrastructure.repositories.analytics_repository import AnalyticsRepository

HEURISTICA_CODE = "HEURISTICA"
COMPLETED_STATES = {"completada", "completado", "finalizada"}

SEVERITY_HIGH = "high"
SEVERITY_MEDIUM = "medium"
SEVERITY_LOW = "low"

# Límites (min, max) de cada escala de respuesta, usados para normalizar
# cualquier plantilla a un puntaje 0-100 comparable.
SCALE_BOUNDS = {
    "categorico": (0, 3),
    "likert_5": (1, 5),
    "likert_9": (1, 9),
}

# Umbrales del estado del proyecto sobre el score normalizado (0-100).
STATUS_THRESHOLDS = (
    (90, "Good"),
    (75, "Fair"),
    (60, "Needs work"),
    (40, "Poor"),
)
STATUS_CRITICAL = "Critical"
STATUS_NO_DATA = "Sin datos"


class AnalyticsService:
    """
    Agrega evaluaciones/respuestas/resultados_dimensiones en el contrato de
    datos que consume el frontend de analíticas. Toda la lógica es Python
    puro sobre objetos ya cargados por el repositorio (sin pandas), tal
    como recomienda analiticas.md para esta primera fase.
    """
    def __init__(self, db):
        self.db = db
        self.repository = AnalyticsRepository(db)

    def get_projects_summary(self, user: User) -> List[ProjectSummaryCard]:
        proyectos = self.repository.get_accessible_projects(user)
        project_ids = [proyecto.id for proyecto in proyectos]
        # Trae evaluaciones/asignaciones de TODOS los proyectos en 2 consultas
        # en vez de 2 por proyecto (antes N+1: la carga de Analytics Home se
        # volvía lenta con varios proyectos).
        evaluaciones_by_project = self.repository.get_evaluations_for_projects(project_ids)
        assignments_by_project = self.repository.get_assignments_for_projects(project_ids)
        return [
            self._build_summary_card(
                proyecto,
                evaluaciones_by_project.get(proyecto.id, []),
                assignments_by_project.get(proyecto.id, []),
            )
            for proyecto in proyectos
        ]

    def get_project_analytics(self, project_id: int, user: User) -> Optional[ProjectAnalyticsResponse]:
        proyecto = self.repository.get_project(project_id)
        if not proyecto or not self.repository.user_has_access(proyecto, user):
            return None

        aggregate = self._aggregate(project_id)
        return ProjectAnalyticsResponse(
            project=ProjectInfo(
                id=proyecto.id,
                nombre=proyecto.nombre,
                descripcion=proyecto.descripcion,
                cliente=proyecto.cliente,
            ),
            has_data=aggregate["has_data"],
            summary=aggregate["summary"],
            severity_breakdown=aggregate["severity"],
            heuristics=aggregate["heuristics"],
            issues=aggregate["issues"],
            evaluators=aggregate["evaluators"],
            timeline=aggregate["timeline"],
        )

    def _build_summary_card(self, proyecto, evaluaciones, assignments) -> ProjectSummaryCard:
        aggregate = self._aggregate_from_data(evaluaciones, assignments)
        last_eval = aggregate["last_evaluation_at"]
        return ProjectSummaryCard(
            id=proyecto.id,
            nombre=proyecto.nombre,
            cliente=proyecto.cliente,
            descripcion=proyecto.descripcion,
            has_data=aggregate["has_data"],
            ux_score=aggregate["summary"].ux_score,
            status=aggregate["summary"].status,
            severity=aggregate["severity"],
            evaluators_count=aggregate["summary"].evaluators_count,
            evaluations_count=aggregate["summary"].total_evaluations,
            last_evaluation_at=last_eval,
        )

    def _aggregate(self, project_id: int) -> dict:
        evaluaciones = self.repository.get_project_evaluations(project_id)
        assignments = self.repository.get_assignments(project_id)
        return self._aggregate_from_data(evaluaciones, assignments)

    def _aggregate_from_data(self, evaluaciones, assignments) -> dict:
        has_data = any(ev.resultados_dimension for ev in evaluaciones)

        timeline, normalized_scores = self._build_timeline(evaluaciones)
        ux_score = round(sum(normalized_scores) / len(normalized_scores)) if normalized_scores else None
        status = self._status_for_score(ux_score, has_data)

        heuristics_map, issues, evaluator_issue_counts = self._build_issues(evaluaciones)

        severity = SeverityCounts()
        for issue in issues:
            setattr(severity, issue.severity, getattr(severity, issue.severity) + 1)

        heuristics = sorted(
            (
                HeuristicBreakdown(
                    dimension_id=dim_id,
                    name=bucket["name"],
                    average=round(sum(bucket["scores"]) / len(bucket["scores"]), 2) if bucket["scores"] else None,
                    high=bucket["high"],
                    medium=bucket["medium"],
                    low=bucket["low"],
                )
                for dim_id, bucket in heuristics_map.items()
            ),
            key=lambda h: (-(h.high * 3 + h.medium * 2 + h.low), h.average if h.average is not None else 0),
        )

        evaluators = self._build_evaluators(evaluaciones, assignments, evaluator_issue_counts)
        evaluators_count = len(evaluators)
        total_issues = len(issues)

        completed_evaluations = sum(1 for ev in evaluaciones if ev.estado in COMPLETED_STATES)
        last_evaluation_at = max((ev.created_at for ev in evaluaciones if ev.created_at), default=None)

        summary = ProjectAnalyticsSummary(
            ux_score=ux_score,
            status=status,
            total_evaluations=len(evaluaciones),
            completed_evaluations=completed_evaluations,
            evaluators_count=evaluators_count,
            total_issues=total_issues,
            high_priority_issues=severity.high,
            avg_issues_per_evaluator=round(total_issues / evaluators_count, 2) if evaluators_count else 0.0,
        )

        issues.sort(key=lambda i: (self._severity_rank(i.severity), -i.agreement_count))

        return {
            "has_data": has_data,
            "summary": summary,
            "severity": severity,
            "heuristics": heuristics,
            "issues": issues,
            "evaluators": evaluators,
            "timeline": timeline,
            "last_evaluation_at": last_evaluation_at,
        }

    def _build_timeline(self, evaluaciones):
        timeline: List[TimelinePoint] = []
        normalized_scores: List[float] = []
        for index, ev in enumerate(evaluaciones):
            if not ev.resultados_dimension:
                continue
            ev_normalized = []
            for resultado in ev.resultados_dimension:
                if resultado.promedio is None:
                    continue
                tipo = self._dimension_tipo(ev, resultado.dimension_id)
                bounds = SCALE_BOUNDS.get(tipo)
                if not bounds:
                    continue
                low, high = bounds
                if high == low:
                    continue
                promedio = float(resultado.promedio)
                normalized = max(0.0, min(100.0, (promedio - low) / (high - low) * 100))
                ev_normalized.append(normalized)
            if not ev_normalized:
                continue
            ev_average = sum(ev_normalized) / len(ev_normalized)
            normalized_scores.append(ev_average)
            timeline.append(
                TimelinePoint(
                    date=ev.created_at.date().isoformat() if ev.created_at else "",
                    label=f"Ev. {index + 1}",
                    average=round(ev_average, 1),
                )
            )
        return timeline, normalized_scores

    def _dimension_tipo(self, evaluacion, dimension_id) -> Optional[str]:
        for respuesta in evaluacion.respuestas:
            if respuesta.pregunta and respuesta.pregunta.dimension_id == dimension_id:
                return respuesta.pregunta.tipo_respuesta
        return None

    def _build_issues(self, evaluaciones):
        heuristica_evaluaciones = [
            ev for ev in evaluaciones if ev.plantilla and ev.plantilla.codigo == HEURISTICA_CODE
        ]

        heuristics_map: dict = {}
        for ev in heuristica_evaluaciones:
            for resultado in ev.resultados_dimension:
                tipo = self._dimension_tipo(ev, resultado.dimension_id)
                if tipo != "categorico":
                    continue
                bucket = heuristics_map.setdefault(
                    resultado.dimension_id,
                    {"name": self._dimension_name(ev, resultado.dimension_id), "high": 0, "medium": 0, "low": 0, "scores": []},
                )
                if resultado.promedio is not None:
                    bucket["scores"].append(float(resultado.promedio))

        pregunta_answers = defaultdict(list)
        for ev in heuristica_evaluaciones:
            for respuesta in ev.respuestas:
                if not respuesta.pregunta or respuesta.pregunta.tipo_respuesta != "categorico":
                    continue
                if respuesta.opcion is None or respuesta.opcion.es_na:
                    continue
                pregunta_answers[respuesta.pregunta_id].append(respuesta.opcion.valor < 3)

        issues: List[IssueItem] = []
        evaluator_issue_counts: dict = defaultdict(int)
        for ev in heuristica_evaluaciones:
            for respuesta in ev.respuestas:
                pregunta = respuesta.pregunta
                if not pregunta or pregunta.tipo_respuesta != "categorico":
                    continue
                opcion = respuesta.opcion
                if opcion is None or opcion.es_na or opcion.valor >= 3:
                    continue

                dim_id = pregunta.dimension_id
                severity = self._severity_for_valor(opcion.valor)
                bucket = heuristics_map.setdefault(
                    dim_id,
                    {"name": self._dimension_name(ev, dim_id), "high": 0, "medium": 0, "low": 0, "scores": []},
                )
                bucket[severity] += 1

                answers = pregunta_answers.get(respuesta.pregunta_id, [])
                agreement_count = sum(1 for is_issue in answers if is_issue)

                if ev.evaluador_id:
                    evaluator_issue_counts[ev.evaluador_id] += 1

                issues.append(
                    IssueItem(
                        id=f"{ev.id}-{respuesta.pregunta_id}",
                        dimension_id=dim_id,
                        heuristic_name=bucket["name"],
                        severity=severity,
                        description=(respuesta.comentario or "").strip() or (pregunta.texto or ""),
                        evaluator_name=ev.evaluador.nombre if ev.evaluador else "Evaluador",
                        evaluation_id=ev.id,
                        agreement_count=agreement_count,
                        agreement_total=len(answers),
                    )
                )

        return heuristics_map, issues, evaluator_issue_counts

    def _dimension_name(self, evaluacion, dimension_id) -> str:
        for respuesta in evaluacion.respuestas:
            if respuesta.pregunta and respuesta.pregunta.dimension_id == dimension_id and respuesta.pregunta.dimension:
                return respuesta.pregunta.dimension.nombre
        return f"Dimensión {dimension_id}"

    def _build_evaluators(self, evaluaciones, assignments, evaluator_issue_counts) -> List[EvaluatorMetric]:
        assignment_by_evaluator = {a.evaluator_id: a for a in assignments}
        evaluator_names: dict = {}
        evaluator_completed: dict = defaultdict(int)

        for ev in evaluaciones:
            if not ev.evaluador_id:
                continue
            if ev.evaluador:
                evaluator_names[ev.evaluador_id] = ev.evaluador.nombre
            if ev.estado in COMPLETED_STATES:
                evaluator_completed[ev.evaluador_id] += 1

        for assignment in assignments:
            if assignment.evaluator:
                evaluator_names.setdefault(assignment.evaluator_id, assignment.evaluator.nombre)

        evaluator_ids = set(assignment_by_evaluator.keys()) | {
            ev.evaluador_id for ev in evaluaciones if ev.evaluador_id
        }

        return [
            EvaluatorMetric(
                id=evaluator_id,
                name=evaluator_names.get(evaluator_id, "Evaluador"),
                role=assignment_by_evaluator[evaluator_id].role if evaluator_id in assignment_by_evaluator else None,
                completed=evaluator_completed.get(evaluator_id, 0),
                issues_found=evaluator_issue_counts.get(evaluator_id, 0),
            )
            for evaluator_id in evaluator_ids
        ]

    def _status_for_score(self, score: Optional[int], has_data: bool) -> str:
        if not has_data or score is None:
            return STATUS_NO_DATA
        for threshold, label in STATUS_THRESHOLDS:
            if score >= threshold:
                return label
        return STATUS_CRITICAL

    def _severity_for_valor(self, valor: int) -> str:
        if valor == 0:
            return SEVERITY_HIGH
        if valor == 1:
            return SEVERITY_MEDIUM
        return SEVERITY_LOW

    def _severity_rank(self, severity: str) -> int:
        return {SEVERITY_HIGH: 0, SEVERITY_MEDIUM: 1, SEVERITY_LOW: 2}.get(severity, 3)
