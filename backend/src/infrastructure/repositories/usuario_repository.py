from sqlalchemy.orm import Session
from ..models import User, Role
from ...domain.schemas import UsuarioCreate

from src.application.services.auth_service import get_password_hash

class UsuarioRepository:
    """
    Repositorio para gestionar las operaciones de base de datos de la entidad User.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str):
        """Busca un usuario por su correo electrónico."""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int):
        """Busca un usuario por su ID primario."""
        return self.db.query(User).filter(User.id == user_id).first()

    def count_users(self) -> int:
        """Cuenta el número total de usuarios registrados."""
        return self.db.query(User).count()

    def create(self, user_data: UsuarioCreate):
        """
        Crea un nuevo usuario auto-registrado (POST /auth/register).

        Todo el que se auto-registra queda como ADMIN, raíz de su propia
        "burbuja" (creado_por = NULL): nadie más lo ve en su listado de
        usuarios. Desde ahí puede crear evaluadores u otros admins mediante
        POST /users/, quienes sí quedan asociados a él vía creado_por.
        """
        hashed_password = get_password_hash(user_data.password)

        db_user = User(
            nombre=user_data.nombre,
            email=user_data.email,
            password_hash=hashed_password,
            active=True,
            creado_por=None,
        )

        self.db.add(db_user)
        self.db.flush() # Get user ID

        role = self.db.query(Role).filter(Role.name == "ADMIN").first()
        if role:
            db_user.roles.append(role)

        self.db.commit()
        self.db.refresh(db_user)
        return db_user
