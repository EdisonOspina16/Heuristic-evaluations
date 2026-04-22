from sqlalchemy.orm import Session
from ..models import Usuario
from ...domain.schemas import UsuarioCreate

from src.application.services.auth_service import get_password_hash

class UsuarioRepository:
    """
    Repositorio para gestionar las operaciones de base de datos de la entidad Usuario.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str):
        """Busca un usuario por su correo electrónico."""
        return self.db.query(Usuario).filter(Usuario.email == email).first()

    def get_by_id(self, user_id: int):
        """Busca un usuario por su ID primario."""
        return self.db.query(Usuario).filter(Usuario.id == user_id).first()

    def create(self, user_data: UsuarioCreate):
        """
        Crea un nuevo usuario en la base de datos, encriptando su contraseña
        con bcrypt antes de persistirla.
        """
        hashed_password = get_password_hash(user_data.password)
        db_user = Usuario(
            nombre=user_data.nombre,
            email=user_data.email,
            password_hash=hashed_password,
            rol=user_data.rol
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
