from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_role, seed_user


def test_regression_last_admin_stays_reachable_after_blocked_deactivation(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    headers = auth_headers(admin)

    # Act
    blocked_response = api_client.patch(f"/users/{admin.id}/status?active=false", headers=headers)
    directory_response = api_client.get("/users/", headers=headers)

    # Assert
    assert blocked_response.status_code == status.HTTP_400_BAD_REQUEST
    assert directory_response.status_code == status.HTTP_200_OK
    persisted_admin = next(user for user in directory_response.json() if user["id"] == admin.id)
    assert persisted_admin["active"] is True


def test_regression_last_admin_role_is_preserved_after_blocked_revocation(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    seed_role(db_session, "EVALUADOR")
    headers = auth_headers(admin)

    # Act
    blocked_response = api_client.put(f"/users/{admin.id}/roles", headers=headers, json=["EVALUADOR"])
    directory_response = api_client.get("/users/", headers=headers)

    # Assert
    assert blocked_response.status_code == status.HTTP_400_BAD_REQUEST
    persisted_admin = next(user for user in directory_response.json() if user["id"] == admin.id)
    assert persisted_admin["roles"][0]["name"] == "ADMIN"


def test_regression_last_admin_delete_does_not_remove_account(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    headers = auth_headers(admin)

    # Act
    blocked_response = api_client.delete(f"/users/{admin.id}", headers=headers)
    directory_response = api_client.get("/users/", headers=headers)

    # Assert
    assert blocked_response.status_code == status.HTTP_400_BAD_REQUEST
    assert any(user["id"] == admin.id for user in directory_response.json())


def test_regression_user_creation_response_never_exposes_password_hash(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.post(
        "/users/?role_name=EVALUADOR",
        headers=auth_headers(admin),
        json={"nombre": "No Leak", "email": "no-leak@example.com", "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert "password" not in response.json()
    assert "password_hash" not in response.json()
