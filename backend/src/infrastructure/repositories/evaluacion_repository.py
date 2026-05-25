from sqlalchemy.orm import Session
from ..models import Evaluacion, Respuesta, ResultadoDimension, EvaluationProgress, Pregunta, Dimension
from ...domain.schemas import EvaluacionCreate

class EvaluacionRepository:
    """
    Repositorio para gestionar operaciones CRUD de Evaluaciones, Respuestas 
    y Resultados de Dimensión en la base de datos.
    """
    def __init__(self, db: Session):
        self.db = db

    def create_evaluacion(self, eval_data: EvaluacionCreate):
        """
        Crea una evaluación base y persiste la lista de respuestas asociadas
        utilizando una única transacción.
        """
        db_eval = self.get_by_id(eval_data.evaluation_id) if eval_data.evaluation_id else None
        total_questions = (
            self.db.query(Pregunta)
            .join(Dimension)
            .filter(Dimension.plantilla_id == eval_data.plantilla_id)
            .count()
        )
        answered_count = len([
            resp for resp in eval_data.respuestas
            if resp.valor_numerico is not None or resp.opcion_id is not None or bool((resp.comentario or "").strip())
        ])
        next_status = "completada" if total_questions > 0 and answered_count >= total_questions else "incompleta"

        if db_eval:
            db_eval.perfil = eval_data.perfil
            db_eval.estudios = eval_data.estudios
            db_eval.estado = next_status
            self.db.query(Respuesta).filter(Respuesta.evaluacion_id == db_eval.id).delete()
            self.db.query(ResultadoDimension).filter(ResultadoDimension.evaluacion_id == db_eval.id).delete()
        else:
            db_eval = Evaluacion(
                plantilla_id=eval_data.plantilla_id,
                proyecto_id=eval_data.proyecto_id,
                evaluador_id=eval_data.evaluador_id,
                perfil=eval_data.perfil,
                estudios=eval_data.estudios,
                estado=next_status
            )
            self.db.add(db_eval)
            self.db.flush()

        for resp in eval_data.respuestas:
            db_resp = Respuesta(
                evaluacion_id=db_eval.id,
                pregunta_id=resp.pregunta_id,
                valor_numerico=resp.valor_numerico,
                opcion_id=resp.opcion_id,
                comentario=resp.comentario
            )
            self.db.add(db_resp)
        
        self.db.commit()
        self.db.refresh(db_eval)
        return db_eval

    def save_draft(self, progress_data):
        db_eval = self.get_by_id(progress_data.evaluation_id) if progress_data.evaluation_id else None
        if not db_eval:
            db_eval = (
                self.db.query(Evaluacion)
                .filter(
                    Evaluacion.plantilla_id == progress_data.plantilla_id,
                    Evaluacion.proyecto_id == progress_data.proyecto_id,
                    Evaluacion.evaluador_id == progress_data.evaluador_id,
                    Evaluacion.estado == "borrador",
                )
                .first()
            )

        if not db_eval:
            db_eval = Evaluacion(
                plantilla_id=progress_data.plantilla_id,
                proyecto_id=progress_data.proyecto_id,
                evaluador_id=progress_data.evaluador_id,
                estado="borrador",
            )
            self.db.add(db_eval)
            self.db.flush()

        for resp in progress_data.respuestas:
            existing = (
                self.db.query(Respuesta)
                .filter(
                    Respuesta.evaluacion_id == db_eval.id,
                    Respuesta.pregunta_id == resp.pregunta_id,
                )
                .first()
            )
            has_content = resp.valor_numerico is not None or resp.opcion_id is not None or bool((resp.comentario or "").strip())
            if existing:
                if has_content:
                    existing.valor_numerico = resp.valor_numerico
                    existing.opcion_id = resp.opcion_id
                    existing.comentario = resp.comentario
                else:
                    self.db.delete(existing)
            elif has_content:
                self.db.add(Respuesta(
                    evaluacion_id=db_eval.id,
                    pregunta_id=resp.pregunta_id,
                    valor_numerico=resp.valor_numerico,
                    opcion_id=resp.opcion_id,
                    comentario=resp.comentario,
                ))

        progress_entry = (
            self.db.query(EvaluationProgress)
            .filter(EvaluationProgress.evaluation_id == db_eval.id)
            .first()
        )
        if not progress_entry:
            progress_entry = EvaluationProgress(evaluation_id=db_eval.id, status="incomplete")
            self.db.add(progress_entry)
        progress_entry.status = progress_data.status or "incomplete"

        self.db.commit()
        self.db.refresh(db_eval)
        return db_eval

    def save_resultado_dimension(self, resultado: ResultadoDimension):
        self.db.add(resultado)
        self.db.commit()

    def get_by_id(self, eval_id: int):
        return self.db.query(Evaluacion).filter(Evaluacion.id == eval_id).first()

    def get_by_project(self, project_id: int):
        return self.db.query(Evaluacion).filter(Evaluacion.proyecto_id == project_id).order_by(Evaluacion.created_at.desc()).all()
