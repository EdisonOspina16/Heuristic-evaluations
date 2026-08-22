from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_user


def test_update_user_status_activates_user(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    target = seed_user(db_session, active=False, role_names=["EVALUADOR"], created_by=admin.id)

    # Act
    response = api_client.patch(f"/users/{target.id}/status?active=true", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["active"] is True


def test_update_user_status_deactivates_evaluator(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    target = seed_user(db_session, active=True, role_names=["EVALUADOR"], created_by=admin.id)

    # Act
    response = api_client.patch(f"/users/{target.id}/status?active=false", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["active"] is False


def test_update_user_status_blocks_last_active_admin_deactivation(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.patch(f"/users/{admin.id}/status?active=false", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Cannot deactivate the last active administrator"


def test_update_user_status_allows_admin_deactivation_when_another_active_admin_exists(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    second_admin = seed_user(db_session, active=True, role_names=["ADMIN"], created_by=admin.id)

    # Act
    response = api_client.patch(f"/users/{second_admin.id}/status?active=false", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["active"] is False


def test_update_user_status_returns_404_for_missing_user(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.patch("/users/9999/status?active=false", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "User not found"
