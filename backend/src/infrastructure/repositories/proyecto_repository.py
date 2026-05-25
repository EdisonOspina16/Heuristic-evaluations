from sqlalchemy.orm import Session
from ..models import Proyecto, User
from sqlalchemy import or_
from ...domain.schemas import ProyectoCreate

class ProyectoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return self.db.query(Proyecto).all()

    def get_by_user(self, user_id: int):
        return (
            self.db.query(Proyecto)
            .outerjoin(Proyecto.evaluadores)
            .filter(or_(Proyecto.creado_por == user_id, User.id == user_id))
            .distinct()
            .all()
        )

    def get_by_id(self, proyecto_id: int):
        return self.db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()

    def create(self, proyecto_data: ProyectoCreate, user_id: int):
        db_proyecto = Proyecto(
            nombre=proyecto_data.nombre,
            descripcion=proyecto_data.descripcion,
            cliente=proyecto_data.cliente,
            creado_por=user_id
        )
        
        self.db.add(db_proyecto)
        self.db.flush()
        
        # Assign evaluators if provided
        if proyecto_data.evaluadores_ids:
            evaluadores = self.db.query(User).filter(User.id.in_(proyecto_data.evaluadores_ids)).all()
            db_proyecto.evaluadores = evaluadores
            
        self.db.commit()
        self.db.refresh(db_proyecto)
        return db_proyecto

    def delete(self, proyecto_id: int):
        db_proyecto = self.get_by_id(proyecto_id)
        if db_proyecto:
            self.db.delete(db_proyecto)
            self.db.commit()
            return True
        return False
