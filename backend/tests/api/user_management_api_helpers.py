from uuid import uuid4
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

with patch("sqlalchemy.sql.schema.MetaData.create_all"):
    from main import app

from src.application.services.auth_service import create_access_token, get_password_hash
from src.infrastructure.database import Base, get_db
from src.infrastructure.models import Permission, Role, User


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def api_client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def unique_email(prefix: str = "user") -> str:
    return f"{prefix}-{uuid4().hex}@example.com"


def seed_permission(db_session, code: str) -> Permission:
    permission = db_session.query(Permission).filter(Permission.code == code).first()
    if permission:
        return permission
    permission = Permission(code=code, name=code, description=f"{code} permission")
    db_session.add(permission)
    db_session.flush()
    return permission


def seed_role(db_session, name: str, permission_codes: list[str] | None = None) -> Role:
    role = db_session.query(Role).filter(Role.name == name).first()
    if not role:
        role = Role(name=name, description=f"{name} role")
        db_session.add(role)
        db_session.flush()
    for code in permission_codes or []:
        permission = seed_permission(db_session, code)
        if permission not in role.permissions:
            role.permissions.append(permission)
    db_session.commit()
    db_session.refresh(role)
    return role


def seed_user(
    db_session,
    *,
    nombre: str = "Test User",
    email: str | None = None,
    password: str = "Secret123!",
    active: bool = True,
    role_names: list[str] | None = None,
    direct_permission_codes: list[str] | None = None,
    created_by: int | None = None,
) -> User:
    user = User(
        nombre=nombre,
        email=email or unique_email(),
        password_hash=get_password_hash(password),
        active=active,
        creado_por=created_by,
    )
    db_session.add(user)
    db_session.flush()

    for role_name in role_names or []:
        role = seed_role(db_session, role_name)
        user.roles.append(role)

    for code in direct_permission_codes or []:
        user.direct_permissions.append(seed_permission(db_session, code))

    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(user: User) -> dict:
    token = create_access_token({"sub": user.email, "id": user.id})
    return {"Authorization": f"Bearer {token}"}


def seed_admin(db_session) -> User:
    seed_role(db_session, "ADMIN")
    seed_role(db_session, "EVALUADOR")
    return seed_user(db_session, nombre="Admin", role_names=["ADMIN"])


def seed_evaluator(db_session, permission_codes: list[str] | None = None) -> User:
    seed_role(db_session, "EVALUADOR", permission_codes or [])
    return seed_user(db_session, nombre="Evaluator", role_names=["EVALUADOR"])
