from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_user


def test_users_endpoints_reject_missing_bearer_token(api_client):
    # Arrange

    # Act
    responses = [
        api_client.get("/users/"),
        api_client.post("/users/", json={"nombre": "No Auth", "email": "noauth@example.com", "password": "Secret123!"}),
        api_client.patch("/users/1/status?active=false"),
        api_client.delete("/users/1"),
        api_client.put("/users/1/roles", json=["ADMIN"]),
        api_client.put("/users/1/permissions", json=[]),
    ]

    # Assert
    assert all(response.status_code == status.HTTP_401_UNAUTHORIZED for response in responses)


def test_inactive_admin_token_is_rejected_by_protected_users_endpoint(api_client, db_session):
    # Arrange
    inactive_admin = seed_user(db_session, active=False, role_names=["ADMIN"])

    # Act
    response = api_client.get("/users/", headers=auth_headers(inactive_admin))

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Inactive user"


def test_malformed_token_is_rejected_by_users_endpoint(api_client):
    # Arrange
    headers = {"Authorization": "Bearer not-a-valid-jwt"}

    # Act
    response = api_client.get("/users/", headers=headers)

    # Assert
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Could not validate credentials"


def test_evaluator_cannot_perform_privileged_user_administration_actions(api_client, db_session):
    # Arrange
    evaluator = seed_user(db_session, role_names=["EVALUADOR"])
    target = seed_user(db_session, role_names=["EVALUADOR"])
    headers = auth_headers(evaluator)

    # Act
    responses = [
        api_client.post("/users/", headers=headers, json={"nombre": "Denied", "email": "denied@example.com", "password": "Secret123!"}),
        api_client.delete(f"/users/{target.id}", headers=headers),
        api_client.put(f"/users/{target.id}/roles", headers=headers, json=["ADMIN"]),
        api_client.put(f"/users/{target.id}/permissions", headers=headers, json=["MANAGE_USERS"]),
    ]

    # Assert
    assert [response.status_code for response in responses] == [
        status.HTTP_403_FORBIDDEN,
        status.HTTP_403_FORBIDDEN,
        status.HTTP_403_FORBIDDEN,
        status.HTTP_403_FORBIDDEN,
    ]
