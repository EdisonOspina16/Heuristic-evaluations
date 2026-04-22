from sqlalchemy.orm import Session
from ..models import Evaluacion, Respuesta, ResultadoDimension
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
        db_eval = Evaluacion(
            plantilla_id=eval_data.plantilla_id,
            proyecto_id=eval_data.proyecto_id,
            evaluador_id=eval_data.evaluador_id,
            perfil=eval_data.perfil,
            estudios=eval_data.estudios,
            estado="completada" # Or as per logic
        )
        self.db.add(db_eval)
        self.db.flush() # Get ID

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

    def save_resultado_dimension(self, resultado: ResultadoDimension):
        self.db.add(resultado)
        self.db.commit()

    def get_by_id(self, eval_id: int):
        return self.db.query(Evaluacion).filter(Evaluacion.id == eval_id).first()
