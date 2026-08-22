from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock

from analytics.src.application.services.analytics_service import AnalyticsService


def _service() -> AnalyticsService:
    service = AnalyticsService(MagicMock())
    service.repository = MagicMock()
    return service


def _opcion(valor, es_na=False):
    return SimpleNamespace(valor=valor, es_na=es_na)


def _pregunta(dimension_id, tipo="categorico", texto="Pregunta", dimension_nombre="Visibilidad y estado del sistema"):
    return SimpleNamespace(
        dimension_id=dimension_id,
        tipo_respuesta=tipo,
        texto=texto,
        dimension=SimpleNamespace(id=dimension_id, nombre=dimension_nombre),
    )


def _respuesta(pregunta_id, pregunta, opcion=None, valor_numerico=None, comentario=None):
    return SimpleNamespace(
        pregunta_id=pregunta_id,
        pregunta=pregunta,
        opcion=opcion,
        valor_numerico=valor_numerico,
        comentario=comentario,
    )


def _resultado(dimension_id, promedio):
    return SimpleNamespace(dimension_id=dimension_id, promedio=promedio)


def _evaluador(evaluador_id, nombre="Evaluador"):
    return SimpleNamespace(id=evaluador_id, nombre=nombre)


def _evaluacion(
    evaluacion_id,
    *,
    plantilla_codigo="HEURISTICA",
    evaluador_id=None,
    evaluador=None,
    estado="completada",
    created_at=None,
    respuestas=None,
    resultados=None,
):
    return SimpleNamespace(
        id=evaluacion_id,
        plantilla=SimpleNamespace(codigo=plantilla_codigo),
        evaluador_id=evaluador_id,
        evaluador=evaluador,
        estado=estado,
        created_at=created_at or datetime(2026, 6, 1),
        respuestas=respuestas or [],
        resultados_dimension=resultados or [],
    )


class TestAggregateHeuristicIssues:
    def test_calcula_severidad_score_y_acuerdo_entre_evaluadores(self):
        service = _service()

        p1 = _pregunta(1)
        p2 = _pregunta(1)

        ana = _evaluador(1, "Ana")
        beto = _evaluador(2, "Beto")

        ev1 = _evaluacion(
            101,
            evaluador_id=1,
            evaluador=ana,
            respuestas=[
                _respuesta(1, p1, opcion=_opcion(0), comentario="Boton invisible"),
                _respuesta(2, p2, opcion=_opcion(3)),
            ],
            resultados=[_resultado(1, 1.5)],
        )
        ev2 = _evaluacion(
            102,
            evaluador_id=2,
            evaluador=beto,
            respuestas=[
                _respuesta(1, p1, opcion=_opcion(1)),
            ],
            resultados=[_resultado(1, 1.0)],
        )

        service.repository.get_project_evaluations.return_value = [ev1, ev2]
        service.repository.get_assignments.return_value = []

        aggregate = service._aggregate(project_id=1)

        assert aggregate["has_data"] is True
        assert aggregate["severity"].high == 1
        assert aggregate["severity"].medium == 1
        assert aggregate["severity"].low == 0

        issues = aggregate["issues"]
        assert len(issues) == 2
        assert {issue.severity for issue in issues} == {"high", "medium"}
        # Ambos evaluadores marcaron la misma pregunta como issue -> acuerdo total.
        assert all(issue.agreement_count == 2 and issue.agreement_total == 2 for issue in issues)

        high_issue = next(issue for issue in issues if issue.severity == "high")
        assert high_issue.description == "Boton invisible"
        assert high_issue.evaluator_name == "Ana"

        # (1.5-0)/3*100=50, (1.0-0)/3*100=33.33 -> promedio 41.67 -> round -> 42 -> "Poor"
        assert aggregate["summary"].ux_score == 42
        assert aggregate["summary"].status == "Poor"

        assert aggregate["summary"].evaluators_count == 2
        assert aggregate["summary"].total_issues == 2
        assert aggregate["summary"].high_priority_issues == 1
        assert aggregate["summary"].avg_issues_per_evaluator == 1.0

        heuristics = aggregate["heuristics"]
        assert len(heuristics) == 1
        assert heuristics[0].dimension_id == 1
        assert heuristics[0].average == 1.25
        assert heuristics[0].high == 1
        assert heuristics[0].medium == 1

        evaluators_by_id = {e.id: e for e in aggregate["evaluators"]}
        assert evaluators_by_id[1].issues_found == 1
        assert evaluators_by_id[2].issues_found == 1
        assert evaluators_by_id[1].completed == 1

    def test_valor_maximo_y_opciones_na_no_generan_issue(self):
        service = _service()
        pregunta = _pregunta(1)
        evaluacion = _evaluacion(
            201,
            evaluador_id=1,
            evaluador=_evaluador(1),
            respuestas=[
                _respuesta(1, pregunta, opcion=_opcion(3)),
                _respuesta(2, pregunta, opcion=_opcion(0, es_na=True)),
            ],
            resultados=[_resultado(1, 3.0)],
        )
        service.repository.get_project_evaluations.return_value = [evaluacion]
        service.repository.get_assignments.return_value = []

        aggregate = service._aggregate(project_id=1)

        assert aggregate["issues"] == []
        assert aggregate["summary"].total_issues == 0

    def test_plantillas_no_heuristica_no_generan_issues_pero_si_score(self):
        service = _service()
        pregunta = _pregunta(1, tipo="likert_5", dimension_nombre="Eficiencia")
        evaluacion = _evaluacion(
            301,
            plantilla_codigo="QUIM",
            evaluador_id=1,
            evaluador=_evaluador(1),
            respuestas=[_respuesta(1, pregunta, valor_numerico=4)],
            resultados=[_resultado(1, 4.0)],
        )
        service.repository.get_project_evaluations.return_value = [evaluacion]
        service.repository.get_assignments.return_value = []

        aggregate = service._aggregate(project_id=1)

        assert aggregate["issues"] == []
        # (4-1)/(5-1)*100 = 75 -> "Fair"
        assert aggregate["summary"].ux_score == 75
        assert aggregate["summary"].status == "Fair"

    def test_sin_evaluaciones_con_resultados_no_hay_datos(self):
        service = _service()
        evaluacion = _evaluacion(401, respuestas=[], resultados=[])
        service.repository.get_project_evaluations.return_value = [evaluacion]
        service.repository.get_assignments.return_value = []

        aggregate = service._aggregate(project_id=1)

        assert aggregate["has_data"] is False
        assert aggregate["summary"].ux_score is None
        assert aggregate["summary"].status == "Sin datos"


class TestGetProjectsSummaryBatching:
    def test_trae_evaluaciones_y_asignaciones_en_una_sola_consulta_por_tipo(self):
        # El resumen de Analytics Home no debe hacer una consulta por
        # proyecto (N+1): debe pedir todos los proyectos accesibles de una
        # vez y repartir los resultados agrupados por proyecto_id.
        service = _service()
        proyecto_1 = SimpleNamespace(id=1, nombre="P1", cliente=None, descripcion=None)
        proyecto_2 = SimpleNamespace(id=2, nombre="P2", cliente=None, descripcion=None)
        service.repository.get_accessible_projects.return_value = [proyecto_1, proyecto_2]

        ev1 = _evaluacion(101, respuestas=[], resultados=[_resultado(1, 3.0)])
        ev2 = _evaluacion(102, respuestas=[], resultados=[])
        service.repository.get_evaluations_for_projects.return_value = {1: [ev1], 2: [ev2]}
        service.repository.get_assignments_for_projects.return_value = {1: [], 2: []}

        cards = service.get_projects_summary(MagicMock())

        service.repository.get_evaluations_for_projects.assert_called_once_with([1, 2])
        service.repository.get_assignments_for_projects.assert_called_once_with([1, 2])
        service.repository.get_project_evaluations.assert_not_called()
        service.repository.get_assignments.assert_not_called()
        assert {card.id for card in cards} == {1, 2}
        assert next(card for card in cards if card.id == 1).has_data is True
        assert next(card for card in cards if card.id == 2).has_data is False


class TestGetProjectAnalytics:
    def test_retorna_none_si_proyecto_no_existe(self):
        service = _service()
        service.repository.get_project.return_value = None

        result = service.get_project_analytics(999, MagicMock())

        assert result is None

    def test_retorna_none_si_usuario_no_tiene_acceso(self):
        service = _service()
        service.repository.get_project.return_value = SimpleNamespace(id=1)
        service.repository.user_has_access.return_value = False

        result = service.get_project_analytics(1, MagicMock())

        assert result is None
