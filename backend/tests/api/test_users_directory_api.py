from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_evaluator, seed_user


def test_get_users_returns_directory_for_admin(api_client, db_session):
    # Arrange: el admin solo ve los usuarios que él mismo creó, no todo el
    # sistema (ni siquiera a sí mismo, que se auto-registró sin dueño).
    admin = seed_admin(db_session)
    evaluator = seed_user(db_session, nombre="Eva", email="eva@example.com", role_names=["EVALUADOR"], created_by=admin.id)
    seed_user(db_session, nombre="Ajeno", email="ajeno@example.com", role_names=["EVALUADOR"])

    # Act
    response = api_client.get("/users/", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert {item["email"] for item in body} == {evaluator.email}
    assert body[0]["created_at"] is not None
    assert "roles" in body[0]


def test_get_users_requires_authentication(api_client):
    # Arrange

    # Act
    response = api_client.get("/users/")

    # Assert
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_users_rejects_user_without_manage_users_permission(api_client, db_session):
    # Arrange
    evaluator = seed_evaluator(db_session)

    # Act
    response = api_client.get("/users/", headers=auth_headers(evaluator))

    # Assert
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions. Required: MANAGE_USERS"


def test_get_users_allows_direct_manage_users_permission(api_client, db_session):
    # Arrange
    user = seed_user(db_session, direct_permission_codes=["MANAGE_USERS"])

    # Act
    response = api_client.get("/users/", headers=auth_headers(user))

    # Assert
    assert response.status_code == status.HTTP_200_OK
