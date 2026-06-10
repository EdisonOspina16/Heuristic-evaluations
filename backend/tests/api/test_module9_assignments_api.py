from datetime import datetime

from fastapi import status
from hamcrest import assert_that, contains_inanyorder, equal_to, has_entries, has_item, has_length

from src.infrastructure.models import EvaluatorProjectAssignment, Proyecto, ProyectoUsuario
from user_management_api_helpers import auth_headers, seed_admin, seed_evaluator


def _project(db_session, *, name, creator_id):
    project = Proyecto(
        nombre=name,
        descripcion=f"{name} description",
        cliente="Cliente QA",
        creado_por=creator_id,
        created_at=datetime(2026, 6, 10, 9, 0, 0),
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


def test_admin_creates_assignment_with_focus_and_multiple_allowed_types(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    evaluator = seed_evaluator(db_session)
    project = _project(db_session, name="Proyecto A", creator_id=admin.id)

    # Act
    response = api_client.post(
        f"/projects/{project.id}/assignments",
        headers=auth_headers(admin),
        json={
            "evaluator_id": evaluator.id,
            "project_id": project.id,
            "role": "UX",
            "allowed_evaluation_types": ["UI", "UX", "Accesibilidad"],
        },
    )

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    assert_that(
        response.json(),
        has_entries(
            evaluator_id=evaluator.id,
            project_id=project.id,
            role="UX",
            allowed_evaluation_types=contains_inanyorder("UI", "UX", "Accesibilidad"),
        ),
    )
    membership = db_session.query(ProyectoUsuario).filter_by(proyecto_id=project.id, usuario_id=evaluator.id).first()
    assert_that(membership.enfoque, equal_to("UX"))


def test_admin_updates_assignment_without_creating_duplicates(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    evaluator = seed_evaluator(db_session)
    project = _project(db_session, name="Proyecto A", creator_id=admin.id)
    db_session.add(
        EvaluatorProjectAssignment(
            evaluator_id=evaluator.id,
            project_id=project.id,
            role="UI",
            allowed_evaluation_types='["UI"]',
        )
    )
    db_session.add(ProyectoUsuario(proyecto_id=project.id, usuario_id=evaluator.id, enfoque="UI"))
    db_session.commit()

    # Act
    response = api_client.post(
        f"/projects/{project.id}/assignments",
        headers=auth_headers(admin),
        json={
            "evaluator_id": evaluator.id,
            "project_id": project.id,
            "role": "Contenido",
            "allowed_evaluation_types": ["Self-Assessment Manikin"],
        },
    )

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    assert_that(response.json()["role"], equal_to("Contenido"))
    assert_that(
        db_session.query(EvaluatorProjectAssignment)
        .filter_by(project_id=project.id, evaluator_id=evaluator.id)
        .count(),
        equal_to(1),
    )
    assert_that(
        db_session.query(ProyectoUsuario).filter_by(proyecto_id=project.id, usuario_id=evaluator.id).count(),
        equal_to(1),
    )


def test_list_assignments_returns_empty_list_for_project_without_team(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    project = _project(db_session, name="Proyecto B", creator_id=admin.id)

    # Act
    response = api_client.get(f"/projects/{project.id}/assignments", headers=auth_headers(admin))

    # Assert
    assert_that(response.status_code, equal_to(status.HTTP_200_OK))
    assert_that(response.json(), equal_to([]))


def test_project_visibility_includes_own_and_admin_assigned_projects(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    evaluator = seed_evaluator(db_session)
    own_project = _project(db_session, name="Proyecto propio", creator_id=evaluator.id)
    assigned_project = _project(db_session, name="Proyecto asignado", creator_id=admin.id)
    hidden_project = _project(db_session, name="Proyecto ajeno", creator_id=admin.id)
    db_session.add(ProyectoUsuario(proyecto_id=assigned_project.id, usuario_id=evaluator.id, enfoque="UI"))
    db_session.commit()

    # Act
    evaluator_response = api_client.get("/projects/", headers=auth_headers(evaluator))
    admin_response = api_client.get("/projects/", headers=auth_headers(admin))

    # Assert
    assert_that(evaluator_response.status_code, equal_to(status.HTTP_200_OK))
    evaluator_names = [item["nombre"] for item in evaluator_response.json()]
    assert_that(evaluator_names, contains_inanyorder("Proyecto propio", "Proyecto asignado"))
    assert_that(evaluator_names, has_length(2))

    assert_that(admin_response.status_code, equal_to(status.HTTP_200_OK))
    assert_that([item["nombre"] for item in admin_response.json()], has_item(hidden_project.nombre))
    assert_that([item["id"] for item in admin_response.json()], contains_inanyorder(own_project.id, assigned_project.id, hidden_project.id))
