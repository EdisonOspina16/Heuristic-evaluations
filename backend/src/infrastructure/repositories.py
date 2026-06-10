from typing import Any, Optional
from sqlalchemy.orm import Session

from src.infrastructure.models import User, Role
from src.domain.repositories import UserRepository, RoleRepository


class SQLAlchemyUserRepository(UserRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[Any]:
        return self.db.query(User).filter(User.email == email).first()

    def count_users(self) -> int:
        return self.db.query(User).count()

    def add_role_to_user(self, user: Any, role: Any) -> None:
        user.roles.append(role)
        self.db.commit()
        self.db.refresh(user)


class SQLAlchemyRoleRepository(RoleRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_name(self, name: str) -> Optional[Any]:
        return self.db.query(Role).filter(Role.name == name).first()
