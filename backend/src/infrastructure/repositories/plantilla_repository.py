from sqlalchemy.orm import Session, joinedload
from ..models import Plantilla, Dimension, Pregunta, OpcionCategorica

class PlantillaRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_active(self):
        return self.db.query(Plantilla).filter(Plantilla.activa == True).all()

    def get_by_id_with_structure(self, plantilla_id: int):
        return self.db.query(Plantilla).options(
            joinedload(Plantilla.dimensiones).joinedload(Dimension.preguntas).joinedload(Pregunta.opciones)
        ).filter(Plantilla.id == plantilla_id).first()

    def get_by_codigo(self, codigo: str):
        return self.db.query(Plantilla).filter(Plantilla.codigo == codigo).first()
