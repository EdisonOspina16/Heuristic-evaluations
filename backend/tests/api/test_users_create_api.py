from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_evaluator, seed_role, seed_user, unique_email


def test_create_user_by_admin_creates_active_user_with_requested_role(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    seed_role(db_session, "EVALUADOR")
    email = unique_email("created")

    # Act
    response = api_client.post(
        "/users/?role_name=EVALUADOR",
        headers=auth_headers(admin),
        json={"nombre": "Created User", "email": email, "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["email"] == email
    assert body["active"] is True
    assert body["roles"][0]["name"] == "EVALUADOR"
    assert "password_hash" not in body


def test_create_user_rejects_duplicate_email(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    existing = seed_user(db_session, email="taken@example.com", role_names=["EVALUADOR"])

    # Act
    response = api_client.post(
        "/users/",
        headers=auth_headers(admin),
        json={"nombre": "Duplicate", "email": existing.email, "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Email already registered"


def test_create_user_rejects_invalid_payload(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.post(
        "/users/",
        headers=auth_headers(admin),
        json={"nombre": "Invalid", "email": "not-an-email"},
    )

    # Assert
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_user_requires_create_users_permission(api_client, db_session):
    # Arrange
    evaluator = seed_evaluator(db_session)

    # Act
    response = api_client.post(
        "/users/",
        headers=auth_headers(evaluator),
        json={"nombre": "Denied", "email": unique_email("denied"), "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions. Required: CREATE_USERS"


def test_create_user_allows_direct_create_users_permission(api_client, db_session):
    # Arrange
    creator = seed_user(db_session, direct_permission_codes=["CREATE_USERS"])
    seed_role(db_session, "EVALUADOR")

    # Act
    response = api_client.post(
        "/users/",
        headers=auth_headers(creator),
        json={"nombre": "Allowed", "email": unique_email("allowed"), "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK


def test_create_user_falls_back_to_evaluator_when_requested_role_is_unknown(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    seed_role(db_session, "EVALUADOR")

    # Act
    response = api_client.post(
        "/users/?role_name=NO_EXISTE",
        headers=auth_headers(admin),
        json={"nombre": "Fallback", "email": unique_email("fallback"), "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["roles"][0]["name"] == "EVALUADOR"
