from types import SimpleNamespace
from datetime import datetime

import jwt
from fastapi import status

from src.application.services import auth_service as auth_service_module
from src.interfaces.api import auth as auth_module


def build_role(name: str, permissions: list[str] | None = None):
    return SimpleNamespace(
        id=1 if name == "ADMIN" else 2,
        name=name,
        description=f"{name} role",
        permissions=[SimpleNamespace(code=code) for code in (permissions or [])],
    )


def build_user(
    user_id: int = 1,
    nombre: str = "Admin",
    email: str = "admin@example.com",
    active: bool = True,
    password_hash: str = "hashed-password",
    roles: list | None = None,
    direct_permissions: list | None = None,
):
    return SimpleNamespace(
        id=user_id,
        nombre=nombre,
        email=email,
        active=active,
        password_hash=password_hash,
        roles=roles or [],
        direct_permissions=direct_permissions or [],
    )


def test_register_with_valid_payload_returns_created_user(client, monkeypatch):
    # Arrange
    created_user = SimpleNamespace(
        id=10,
        nombre="Juan Perez",
        email="juan@example.com",
        active=True,
        created_at=datetime(2026, 6, 6, 0, 0, 0),
        roles=[build_role("EVALUADOR")],
        direct_permissions=[],
    )
    fake_repo = SimpleNamespace(
        get_by_email=lambda email: None,
        create=lambda user_data: created_user,
    )
    monkeypatch.setattr(auth_module, "UsuarioRepository", lambda db: fake_repo)

    # Act
    response = client.post(
        "/auth/register",
        json={
            "nombre": "Juan Perez",
            "email": "juan@example.com",
            "password": "Secret123!",
        },
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["email"] == "juan@example.com"
    assert payload["roles"][0]["name"] == "EVALUADOR"


def test_register_with_missing_fields_returns_422(client):
    # Arrange
    missing_password_payload = {
        "nombre": "Juan Perez",
        "email": "juan@example.com",
    }

    # Act
    response = client.post("/auth/register", json=missing_password_payload)

    # Assert
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_register_with_duplicate_email_returns_400(client, monkeypatch):
    # Arrange
    existing_user = build_user(email="juan@example.com")
    fake_repo = SimpleNamespace(
        get_by_email=lambda email: existing_user,
        create=lambda user_data: None,
    )
    monkeypatch.setattr(auth_module, "UsuarioRepository", lambda db: fake_repo)

    # Act
    response = client.post(
        "/auth/register",
        json={
            "nombre": "Juan Perez",
            "email": "juan@example.com",
            "password": "Secret123!",
        },
    )

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Email already registered"


def test_login_with_valid_credentials_returns_jwt_valid(client, monkeypatch):
    # Arrange
    user = build_user(
        user_id=7,
        nombre="Maria",
        email="maria@example.com",
        roles=[build_role("ADMIN", ["MANAGE_USERS"])],
        direct_permissions=[SimpleNamespace(code="CREATE_PROJECTS")],
    )
    fake_repo = SimpleNamespace(get_by_email=lambda email: user)
    monkeypatch.setattr(auth_module, "UsuarioRepository", lambda db: fake_repo)
    monkeypatch.setattr(auth_module, "verify_password", lambda plain, hashed: True)

    # Act
    response = client.post(
        "/auth/login",
        json={"email": "maria@example.com", "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    decoded = jwt.decode(
        payload["access_token"],
        auth_service_module.SECRET_KEY,
        algorithms=[auth_service_module.ALGORITHM],
    )
    assert decoded["sub"] == "maria@example.com"
    assert decoded["id"] == 7
    assert decoded["rol"] == "ADMIN"
    assert set(payload["user"]["permissions"]) == {"MANAGE_USERS", "CREATE_PROJECTS"}


def test_login_with_wrong_password_returns_401(client, monkeypatch):
    # Arrange
    user = build_user(email="maria@example.com")
    fake_repo = SimpleNamespace(get_by_email=lambda email: user)
    monkeypatch.setattr(auth_module, "UsuarioRepository", lambda db: fake_repo)
    monkeypatch.setattr(auth_module, "verify_password", lambda plain, hashed: False)

    # Act
    response = client.post(
        "/auth/login",
        json={"email": "maria@example.com", "password": "WrongPass"},
    )

    # Assert
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.headers["www-authenticate"] == "Bearer"


def test_login_with_inactive_user_returns_403(client, monkeypatch):
    # Arrange
    user = build_user(email="maria@example.com", active=False)
    fake_repo = SimpleNamespace(get_by_email=lambda email: user)
    monkeypatch.setattr(auth_module, "UsuarioRepository", lambda db: fake_repo)
    monkeypatch.setattr(auth_module, "verify_password", lambda plain, hashed: True)

    # Act
    response = client.post(
        "/auth/login",
        json={"email": "maria@example.com", "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "User account is inactive"


def test_logout_with_valid_request_returns_success_message(client):
    # Arrange
    expected_message = "Logged out successfully"

    # Act
    response = client.post("/auth/logout")

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == expected_message
