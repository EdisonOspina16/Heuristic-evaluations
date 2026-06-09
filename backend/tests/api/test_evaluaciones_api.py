from __future__ import annotations

from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import status


def _evaluacion_response(evaluation_id: int = 1, estado: str = "completada"):
    return SimpleNamespace(
        id=evaluation_id,
        plantilla_id=1,
        proyecto_id=10,
        evaluador_id=5,
        estado=estado,
        fecha=date(2026, 6, 8),
        created_at=datetime(2026, 6, 8, 12, 0, 0),
        plantilla_nombre="Evaluacion Heuristica",
        evaluador_nombre="Evaluator",
        perfil="UX",
        estudios="Maestria",
        progress_percentage=100 if estado == "completada" else 50,
        answered_count=2,
        total_questions=2,
    )


def _evaluacion_payload():
    return {
        "plantilla_id": 1,
        "proyecto_id": 10,
        "evaluador_id": 5,
        "perfil": "UX",
        "estudios": "Maestria",
        "respuestas": [
            {"pregunta_id": 1, "valor_numerico": "4", "comentario": "ok"},
            {"pregunta_id": 2, "opcion_id": 8},
        ],
    }


def _progress_payload():
    return {
        "evaluation_id": 77,
        "plantilla_id": 1,
        "proyecto_id": 10,
        "evaluador_id": 5,
        "status": "incomplete",
        "respuestas": [
            {"pregunta_id": 1, "valor_numerico": "3", "comentario": "avance"},
        ],
    }


def _progress_response(evaluation_id: int = 77):
    return {
        "evaluation_id": evaluation_id,
        "plantilla_id": 1,
        "proyecto_id": 10,
        "evaluador_id": 5,
        "estado": "borrador",
        "progress_percentage": 50,
        "answered_count": 1,
        "total_questions": 2,
        "respuestas": [
            {
                "pregunta_id": 1,
                "valor_numerico": "3",
                "opcion_id": None,
                "comentario": "avance",
            }
        ],
        "updated_at": datetime(2026, 6, 8, 12, 0, 0),
    }


def test_post_evaluaciones_registra_evaluacion_exitosamente(api_client):
    # Arrange
    created = _evaluacion_response(123)

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.registrar_evaluacion",
        return_value=created,
    ) as mock_registrar:
        # Act
        response = api_client.post("/evaluaciones/", json=_evaluacion_payload())

    # Assert
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["id"] == 123
    assert body["estado"] == "completada"
    assert body["progress_percentage"] == 100
    mock_registrar.assert_called_once()


def test_post_evaluaciones_retorna_400_si_servicio_falla(api_client):
    # Arrange
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.registrar_evaluacion",
        side_effect=Exception("backend error"),
    ):
        # Act
        response = api_client.post("/evaluaciones/", json=_evaluacion_payload())

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "backend error"


def test_get_evaluaciones_proyecto_retorna_datos(api_client):
    # Arrange
    evaluaciones = [
        _evaluacion_response(1, estado="completada"),
        _evaluacion_response(2, estado="incompleta"),
    ]

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_evaluaciones_proyecto",
        return_value=evaluaciones,
    ) as mock_get:
        # Act
        response = api_client.get("/evaluaciones/proyecto/10")

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.json()] == [1, 2]
    mock_get.assert_called_once_with(10)


def test_get_evaluaciones_proyecto_retorna_lista_vacia(api_client):
    # Arrange
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_evaluaciones_proyecto",
        return_value=[],
    ) as mock_get:
        # Act
        response = api_client.get("/evaluaciones/proyecto/10")

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []
    mock_get.assert_called_once_with(10)


def test_patch_progress_guarda_progreso_exitosamente(api_client):
    # Arrange
    draft = _evaluacion_response(77, estado="borrador")

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.guardar_progreso",
        return_value=draft,
    ) as mock_guardar:
        # Act
        response = api_client.patch("/evaluaciones/progress", json=_progress_payload())

    # Assert
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["id"] == 77
    assert body["estado"] == "borrador"
    mock_guardar.assert_called_once()


def test_patch_progress_retorna_400_si_servicio_falla(api_client):
    # Arrange
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.guardar_progreso",
        side_effect=Exception("save failed"),
    ):
        # Act
        response = api_client.patch("/evaluaciones/progress", json=_progress_payload())

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "save failed"


def test_get_progress_retorna_progreso_encontrado(api_client):
    # Arrange
    progress = _progress_response(77)

    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_progreso",
        return_value=progress,
    ) as mock_get:
        # Act
        response = api_client.get("/evaluaciones/progress/77")

    # Assert
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["evaluation_id"] == 77
    assert body["respuestas"][0]["comentario"] == "avance"
    mock_get.assert_called_once_with(77)


def test_get_progress_retorna_404_si_no_existe(api_client):
    # Arrange
    with patch(
        "src.interfaces.api.evaluaciones.EvaluacionService.get_progreso",
        return_value=None,
    ) as mock_get:
        # Act
        response = api_client.get("/evaluaciones/progress/999")

    # Assert
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Evaluation progress not found"
    mock_get.assert_called_once_with(999)
