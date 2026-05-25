from sqlalchemy.orm import Session
from ...infrastructure.repositories.evaluacion_repository import EvaluacionRepository
from ...infrastructure.models import ResultadoDimension, Respuesta, Pregunta, OpcionCategorica
from ...domain.schemas import EvaluacionCreate, ProgressSave
from decimal import Decimal

class EvaluacionService:
    """
    Servicio de aplicación encargado de la lógica de negocio para las evaluaciones.
    Gestiona el registro de respuestas y el cálculo automático de resultados.
    """
    def __init__(self, db: Session):
        self.db = db
        self.repository = EvaluacionRepository(db)

    def registrar_evaluacion(self, eval_data: EvaluacionCreate):
        """
        Registra una nueva evaluación en el sistema.
        1. Persiste la evaluación y sus respuestas.
        2. Calcula y guarda los resultados agregados por dimensión.
        """
        # 1. Persistir evaluación y respuestas
        db_eval = self.repository.create_evaluacion(eval_data)

        # 2. Calcular resultados por dimensión
        self.calcular_resultados(db_eval.id)

        return db_eval

    def get_evaluaciones_proyecto(self, project_id: int):
        return self.repository.get_by_project(project_id)

    def guardar_progreso(self, progress_data: ProgressSave):
        return self.repository.save_draft(progress_data)

    def get_progreso(self, evaluation_id: int):
        evaluacion = self.repository.get_by_id(evaluation_id)
        if not evaluacion:
            return None
        return {
            "evaluation_id": evaluacion.id,
            "plantilla_id": evaluacion.plantilla_id,
            "proyecto_id": evaluacion.proyecto_id,
            "evaluador_id": evaluacion.evaluador_id,
            "estado": evaluacion.estado,
            "progress_percentage": evaluacion.progress_percentage,
            "answered_count": evaluacion.answered_count,
            "total_questions": evaluacion.total_questions,
            "respuestas": [
                {
                    "pregunta_id": respuesta.pregunta_id,
                    "valor_numerico": respuesta.valor_numerico,
                    "opcion_id": respuesta.opcion_id,
                    "comentario": respuesta.comentario,
                }
                for respuesta in evaluacion.respuestas
            ],
            "updated_at": evaluacion.created_at,
        }

    def calcular_resultados(self, evaluacion_id: int):
        """
        Lógica para agrupar respuestas de una evaluación por dimensión,
        calcular promedios e identificar advertencias (hallazgos críticos).
        """
        # Lógica para agrupar respuestas por dimensión y calcular promedios
        # Esto es un resumen simplificado de la lógica
        respuestas = self.db.query(Respuesta).join(Pregunta).filter(Respuesta.evaluacion_id == evaluacion_id).all()
        
        dimensiones_data = {} # {dimension_id: {suma: 0, count: 0, warnings: 0}}

        for r in respuestas:
            dim_id = r.pregunta.dimension_id
            if dim_id not in dimensiones_data:
                dimensiones_data[dim_id] = {"suma": Decimal(0), "count": 0, "warnings": 0}
            
            valor = r.valor_numerico
            # Si es heurística, el valor viene de la opción si valor_numerico es nulo
            if valor is None and r.opcion_id:
                valor = Decimal(r.opcion.valor)
                # Hallazgo crítico si el valor es bajo (ej: <= 1)
                if r.opcion.valor <= 1 and not r.opcion.es_na:
                    dimensiones_data[dim_id]["warnings"] += 1

            if valor is not None:
                dimensiones_data[dim_id]["suma"] += valor
                dimensiones_data[dim_id]["count"] += 1

        for dim_id, data in dimensiones_data.items():
            if data["count"] > 0:
                promedio = data["suma"] / data["count"]
                resultado = ResultadoDimension(
                    evaluacion_id=evaluacion_id,
                    dimension_id=dim_id,
                    promedio=promedio,
                    total_preguntas=data["count"], # O el total de la dimensión
                    respondidas=data["count"],
                    warnings=data["warnings"]
                )
                self.db.add(resultado)
        
        self.db.commit()
