from __future__ import annotations

from unittest.mock import patch

from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_evaluator


def _summary_card(project_id: int = 1):
    return {
        "id": project_id,
        "nombre": "Proyecto Demo",
        "cliente": "Acme",
        "descripcion": "Descripcion",
        "has_data": True,
        "ux_score": 72,
        "status": "Fair",
        "severity": {"high": 1, "medium": 2, "low": 0},
        "evaluators_count": 2,
        "evaluations_count": 3,
        "last_evaluation_at": "2026-06-01T00:00:00",
    }


def _project_analytics(project_id: int = 1):
    return {
        "project": {"id": project_id, "nombre": "Proyecto Demo", "descripcion": "Descripcion", "cliente": "Acme"},
        "has_data": True,
        "summary": {
            "ux_score": 72,
            "status": "Fair",
            "total_evaluations": 3,
            "completed_evaluations": 2,
            "evaluators_count": 2,
            "total_issues": 3,
            "high_priority_issues": 1,
            "avg_issues_per_evaluator": 1.5,
        },
        "severity_breakdown": {"high": 1, "medium": 2, "low": 0},
        "heuristics": [
            {"dimension_id": 1, "name": "Visibilidad", "average": 1.5, "high": 1, "medium": 1, "low": 0},
        ],
        "issues": [
            {
                "id": "101-1",
                "dimension_id": 1,
                "heuristic_name": "Visibilidad",
                "severity": "high",
                "description": "Boton invisible",
                "evaluator_name": "Ana",
                "evaluation_id": 101,
                "agreement_count": 2,
                "agreement_total": 2,
            }
        ],
        "evaluators": [
            {"id": 1, "name": "Ana", "role": "Evaluator", "completed": 1, "issues_found": 1},
        ],
        "timeline": [{"date": "2026-06-01", "label": "Ev. 1", "average": 50.0}],
    }


def test_get_projects_summary_requiere_autenticacion(api_client):
    response = api_client.get("/analytics/projects")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_projects_summary_retorna_403_sin_permiso(api_client, db_session):
    user = seed_evaluator(db_session, [])

    response = api_client.get("/analytics/projects", headers=auth_headers(user))

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_get_projects_summary_retorna_datos_con_permiso(api_client, db_session):
    user = seed_evaluator(db_session, ["VIEW_REPORTS"])

    with patch(
        "analytics.src.interfaces.api.analytics.AnalyticsService.get_projects_summary",
        return_value=[_summary_card(1)],
    ) as mock_summary:
        response = api_client.get("/analytics/projects", headers=auth_headers(user))

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body[0]["id"] == 1
    assert body[0]["status"] == "Fair"
    mock_summary.assert_called_once()


def test_get_project_analytics_retorna_datos_para_admin(api_client, db_session):
    admin = seed_admin(db_session)

    with patch(
        "analytics.src.interfaces.api.analytics.AnalyticsService.get_project_analytics",
        return_value=_project_analytics(1),
    ) as mock_get:
        response = api_client.get("/analytics/projects/1", headers=auth_headers(admin))

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["project"]["id"] == 1
    assert body["summary"]["ux_score"] == 72
    assert len(body["issues"]) == 1
    mock_get.assert_called_once()


def test_get_project_analytics_retorna_404_si_no_hay_acceso_o_no_existe(api_client, db_session):
    user = seed_evaluator(db_session, ["VIEW_REPORTS"])

    with patch(
        "analytics.src.interfaces.api.analytics.AnalyticsService.get_project_analytics",
        return_value=None,
    ):
        response = api_client.get("/analytics/projects/999", headers=auth_headers(user))

    assert response.status_code == status.HTTP_404_NOT_FOUND
