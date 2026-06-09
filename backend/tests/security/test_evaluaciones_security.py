from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

with patch("sqlalchemy.sql.schema.MetaData.create_all"):
    from main import app

from src.infrastructure.database import Base, get_db


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


def _evaluacion_payload(**overrides):
    payload = {
        "plantilla_id": 1,
        "proyecto_id": 10,
        "evaluador_id": 5,
        "perfil": "UX",
        "estudios": "Maestria",
        "respuestas": [
            {"pregunta_id": 101, "valor_numerico": "4", "comentario": "ok"},
            {"pregunta_id": 102, "opcion_id": 1, "comentario": ""},
        ],
    }
    payload.update(overrides)
    return payload


def _progress_payload(**overrides):
    payload = {
        "evaluation_id": 77,
        "plantilla_id": 1,
        "proyecto_id": 10,
        "evaluador_id": 5,
        "respuestas": [
            {"pregunta_id": 101, "valor_numerico": "3", "comentario": "avance"},
        ],
    }
    payload.update(overrides)
    return payload


def _evaluacion_response(evaluation_id: int = 123, estado: str = "completada"):
    return SimpleNamespace(
        id=evaluation_id,
        plantilla_id=1,
        proyecto_id=10,
        evaluador_id=5,
        estado=estado,
        fecha=date(2026, 6, 9),
        created_at=datetime(2026, 6, 9, 12, 0, 0),
        plantilla_nombre="Evaluacion Heuristica",
        evaluador_nombre="Tester",
        perfil="UX",
        estudios="Maestria",
        progress_percentage=100 if estado == "completada" else 50,
        answered_count=2,
        total_questions=2,
    )


def _expired_token_headers():
    expired_payload = {
        "sub": "tester@test.com",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
    }
    token = jwt.encode(expired_payload, "test-secret", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_post_evaluaciones_acepta_comentario_xss_como_texto(api_client):
    xss_comment = "<script>alert('xss')</script>"
    payload = _evaluacion_payload(
        respuestas=[{"pregunta_id": 101, "valor_numerico": "4", "comentario": xss_comment}]
    )

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.registrar_evaluacion",
        return_value=_evaluacion_response(),
    ) as mock_registrar:
        response = api_client.post("/evaluaciones/", json=payload)

    assert response.status_code == status.HTTP_200_OK
    eval_data = mock_registrar.call_args.args[0]
    assert eval_data.respuestas[0].comentario == xss_comment


def test_patch_progress_acepta_html_injection_como_texto(api_client):
    html_comment = "<img src=x onerror=alert(1)>"
    payload = _progress_payload(
        respuestas=[{"pregunta_id": 101, "valor_numerico": "3", "comentario": html_comment}]
    )

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.guardar_progreso",
        return_value=_evaluacion_response(77, estado="borrador"),
    ) as mock_guardar:
        response = api_client.patch("/evaluaciones/progress", json=payload)

    assert response.status_code == status.HTTP_200_OK
    progress_data = mock_guardar.call_args.args[0]
    assert progress_data.respuestas[0].comentario == html_comment


def test_post_evaluaciones_rechaza_payload_malformado(api_client):
    response = api_client.post(
        "/evaluaciones/",
        json={"plantilla_id": "no-numerico", "respuestas": "no-es-lista"},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_patch_progress_rechaza_ids_manipulados_desde_servicio(api_client):
    payload = _progress_payload(evaluation_id=-77, proyecto_id=-10, evaluador_id=-5)

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.guardar_progreso",
        side_effect=Exception("ids invalidos"),
    ):
        response = api_client.patch("/evaluaciones/progress", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "ids invalidos"


def test_get_progress_retorna_404_para_evaluacion_inexistente(api_client):
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_progreso",
        return_value=None,
    ) as mock_get:
        response = api_client.get("/evaluaciones/progress/999999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Evaluation progress not found"
    mock_get.assert_called_once_with(999999)


def test_get_progress_sin_token_no_altera_validacion_de_evaluacion(api_client):
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_progreso",
        return_value=None,
    ) as mock_get:
        response = api_client.get("/evaluaciones/progress/77")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    mock_get.assert_called_once_with(77)


def test_get_progress_con_token_invalido_no_altera_validacion_de_evaluacion(api_client):
    headers = {"Authorization": "Bearer not-a-valid-jwt"}

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_progreso",
        return_value=None,
    ) as mock_get:
        response = api_client.get("/evaluaciones/progress/77", headers=headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    mock_get.assert_called_once_with(77)


def test_get_progress_con_token_expirado_no_altera_validacion_de_evaluacion(api_client):
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_progreso",
        return_value=None,
    ) as mock_get:
        response = api_client.get("/evaluaciones/progress/77", headers=_expired_token_headers())

    assert response.status_code == status.HTTP_404_NOT_FOUND
    mock_get.assert_called_once_with(77)


def test_post_evaluaciones_ignora_parametros_inesperados(api_client):
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.registrar_evaluacion",
        return_value=_evaluacion_response(),
    ) as mock_registrar:
        response = api_client.post(
            "/evaluaciones/?admin=true&force_complete=true",
            json=_evaluacion_payload(rol="ADMIN", permisos=["*"]),
        )

    assert response.status_code == status.HTTP_200_OK
    eval_data = mock_registrar.call_args.args[0]
    assert not hasattr(eval_data, "rol")
    assert not hasattr(eval_data, "permisos")


def test_post_evaluaciones_rechaza_datos_fuera_de_rango_desde_servicio(api_client):
    payload = _evaluacion_payload(
        respuestas=[{"pregunta_id": 101, "valor_numerico": "999", "comentario": "fuera de rango"}]
    )

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.registrar_evaluacion",
        side_effect=Exception("valor fuera de rango"),
    ):
        response = api_client.post("/evaluaciones/", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "valor fuera de rango"
