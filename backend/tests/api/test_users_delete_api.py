from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_evaluator, seed_user


def test_delete_user_deletes_evaluator(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    target = seed_user(db_session, role_names=["EVALUADOR"])

    # Act
    response = api_client.delete(f"/users/{target.id}", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "User deleted successfully"


def test_delete_user_blocks_last_registered_admin(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.delete(f"/users/{admin.id}", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Cannot delete the last administrator"


def test_delete_user_allows_admin_delete_when_another_admin_exists(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    second_admin = seed_user(db_session, role_names=["ADMIN"])

    # Act
    response = api_client.delete(f"/users/{second_admin.id}", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "User deleted successfully"


def test_delete_user_returns_404_for_missing_user(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.delete("/users/9999", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "User not found"


def test_delete_user_requires_delete_users_permission(api_client, db_session):
    # Arrange
    evaluator = seed_evaluator(db_session)
    target = seed_user(db_session, role_names=["EVALUADOR"])

    # Act
    response = api_client.delete(f"/users/{target.id}", headers=auth_headers(evaluator))

    # Assert
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions. Required: DELETE_USERS"
