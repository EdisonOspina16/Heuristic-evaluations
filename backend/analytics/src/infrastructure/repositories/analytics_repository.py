from collections import defaultdict
from typing import Dict, List

from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_
from src.infrastructure.models import (
    Proyecto,
    User,
    Evaluacion,
    EvaluatorProjectAssignment,
    Respuesta,
    Pregunta,
)

_EVALUATION_LOAD_OPTIONS = (
    joinedload(Evaluacion.plantilla),
    joinedload(Evaluacion.evaluador),
    selectinload(Evaluacion.resultados_dimension),
    selectinload(Evaluacion.respuestas)
    .joinedload(Respuesta.pregunta)
    .joinedload(Pregunta.dimension),
    selectinload(Evaluacion.respuestas).joinedload(Respuesta.opcion),
)


class AnalyticsRepository:
    """
    Repositorio de solo lectura para el módulo de analíticas. Reutiliza los
    modelos del módulo core (misma base de datos, un solo monolito) sin
    modificar ni duplicar su lógica de escritura.

    Los métodos `*_for_projects` traen datos de varios proyectos en una sola
    consulta (agrupada en Python por proyecto) en vez de una consulta por
    proyecto, para evitar el patrón N+1 que hacía lenta la carga de
    Analytics Home con varios proyectos.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_accessible_projects(self, user: User):
        if any(role.name == "ADMIN" for role in user.roles):
            return self.db.query(Proyecto).all()
        return (
            self.db.query(Proyecto)
            .outerjoin(Proyecto.evaluadores)
            .filter(or_(Proyecto.creado_por == user.id, User.id == user.id))
            .distinct()
            .all()
        )

    def user_has_access(self, proyecto: Proyecto, user: User) -> bool:
        if any(role.name == "ADMIN" for role in user.roles):
            return True
        if proyecto.creado_por == user.id:
            return True
        return any(evaluador.id == user.id for evaluador in proyecto.evaluadores)

    def get_project(self, project_id: int):
        return self.db.query(Proyecto).filter(Proyecto.id == project_id).first()

    def get_project_evaluations(self, project_id: int) -> List[Evaluacion]:
        return self.get_evaluations_for_projects([project_id]).get(project_id, [])

    def get_evaluations_for_projects(self, project_ids: List[int]) -> Dict[int, List[Evaluacion]]:
        if not project_ids:
            return {}
        rows = (
            self.db.query(Evaluacion)
            .options(*_EVALUATION_LOAD_OPTIONS)
            .filter(Evaluacion.proyecto_id.in_(project_ids))
            .order_by(Evaluacion.created_at.asc())
            .all()
        )
        grouped: Dict[int, List[Evaluacion]] = defaultdict(list)
        for evaluacion in rows:
            grouped[evaluacion.proyecto_id].append(evaluacion)
        return grouped

    def get_assignments(self, project_id: int) -> List[EvaluatorProjectAssignment]:
        return self.get_assignments_for_projects([project_id]).get(project_id, [])

    def get_assignments_for_projects(self, project_ids: List[int]) -> Dict[int, List[EvaluatorProjectAssignment]]:
        if not project_ids:
            return {}
        rows = (
            self.db.query(EvaluatorProjectAssignment)
            .options(joinedload(EvaluatorProjectAssignment.evaluator))
            .filter(EvaluatorProjectAssignment.project_id.in_(project_ids))
            .all()
        )
        grouped: Dict[int, List[EvaluatorProjectAssignment]] = defaultdict(list)
        for assignment in rows:
            grouped[assignment.project_id].append(assignment)
        return grouped
