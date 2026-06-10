from datetime import datetime

from fastapi import status
from hamcrest import assert_that, equal_to

from src.infrastructure.models import EvaluatorProjectAssignment, Proyecto
from user_management_api_helpers import auth_headers, seed_admin, seed_evaluator


def test_assignment_with_empty_allowed_types_round_trips_as_unrestricted(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    evaluator = seed_evaluator(db_session)
    project = Proyecto(
        nombre="Proyecto sin restricciones",
        descripcion="Sin tipos permitidos explicitos",
        cliente="QA",
        creado_por=admin.id,
        created_at=datetime(2026, 6, 10, 12, 0, 0),
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Act
    response = api_client.post(
        f"/projects/{project.id}/assignments",
        headers=auth_headers(admin),
        json={"evaluator_id": evaluator.id, "project_id": project.id, "role": "General", "allowed_evaluation_types": []},
    )
    list_response = api_client.get(f"/projects/{project.id}/assignments", headers=auth_headers(admin))

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    assert_that(response.json()["allowed_evaluation_types"], equal_to([]))
    assert_that(list_response.json()[0]["allowed_evaluation_types"], equal_to([]))


def test_assignment_list_keeps_evaluator_metadata_and_focus_after_update(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    evaluator = seed_evaluator(db_session)
    project = Proyecto(
        nombre="Proyecto metadata",
        descripcion="Datos visibles del equipo",
        cliente="QA",
        creado_por=admin.id,
        created_at=datetime(2026, 6, 10, 13, 0, 0),
    )
    db_session.add(project)
    db_session.add(
        EvaluatorProjectAssignment(
            evaluator_id=evaluator.id,
            project_id=1,
            role="UI",
            allowed_evaluation_types='["UI"]',
        )
    )
    db_session.commit()
    db_session.refresh(project)

    # Act
    response = api_client.post(
        f"/projects/{project.id}/assignments",
        headers=auth_headers(admin),
        json={"evaluator_id": evaluator.id, "project_id": project.id, "role": "UX", "allowed_evaluation_types": ["UX"]},
    )
    list_response = api_client.get(f"/projects/{project.id}/assignments", headers=auth_headers(admin))

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    body = list_response.json()[0]
    assert_that(body["evaluator_name"], equal_to(evaluator.nombre))
    assert_that(body["evaluator_email"], equal_to(evaluator.email))
    assert_that(body["role"], equal_to("UX"))
    assert_that(body["allowed_evaluation_types"], equal_to(["UX"]))
