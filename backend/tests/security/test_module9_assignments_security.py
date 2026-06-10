from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from hamcrest import assert_that, equal_to
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

with patch("sqlalchemy.sql.schema.MetaData.create_all"):
    from main import app

from src.infrastructure.database import Base, get_db
from src.infrastructure.models import Proyecto
from user_management_api_helpers import auth_headers, seed_admin, seed_evaluator


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = testing_session_local()
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


def _project(db_session, creator_id):
    project = Proyecto(
        nombre="Proyecto Seguro",
        descripcion="Validaciones de seguridad modulo 9",
        cliente="QA",
        creado_por=creator_id,
        created_at=datetime(2026, 6, 10, 10, 0, 0),
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


def test_assignment_upsert_requires_authenticated_user(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    evaluator = seed_evaluator(db_session)
    project = _project(db_session, admin.id)

    # Act
    response = api_client.post(
        f"/projects/{project.id}/assignments",
        json={"evaluator_id": evaluator.id, "project_id": project.id, "role": "UI", "allowed_evaluation_types": ["UI"]},
    )

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_401_UNAUTHORIZED))


def test_assignment_upsert_rejects_evaluator_without_manage_users(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    evaluator = seed_evaluator(db_session)
    project = _project(db_session, admin.id)

    # Act
    response = api_client.post(
        f"/projects/{project.id}/assignments",
        headers=auth_headers(evaluator),
        json={"evaluator_id": evaluator.id, "project_id": project.id, "role": "UX", "allowed_evaluation_types": ["UX"]},
    )

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_403_FORBIDDEN))
    assert_that(response.json()["detail"], equal_to("Not enough permissions. Required: MANAGE_USERS"))


@pytest.mark.xfail(reason="El backend aun no valida allowed_evaluation_types al crear evaluaciones.")
def test_evaluation_creation_rejects_template_not_allowed_for_assignment(api_client):
    # Arrange
    response_model = SimpleNamespace(
        id=123,
        plantilla_id=2,
        proyecto_id=10,
        evaluador_id=7,
        estado="completada",
        fecha=datetime(2026, 6, 10).date(),
        created_at=datetime(2026, 6, 10, 11, 0, 0),
        plantilla_nombre="UX",
        evaluador_nombre="Juan Perez",
        perfil="UX",
        estudios=None,
        progress_percentage=100,
        answered_count=1,
        total_questions=1,
    )
    payload = {
        "plantilla_id": 2,
        "proyecto_id": 10,
        "evaluador_id": 7,
        "respuestas": [{"pregunta_id": 1, "valor_numerico": "4"}],
    }

    with patch("src.interfaces.api.evaluaciones.EvaluacionService.registrar_evaluacion", return_value=response_model):
        # Act
        response = api_client.post("/evaluaciones/", json=payload)

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_403_FORBIDDEN))
