from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_permission, seed_user


def test_list_permissions_returns_seeded_permissions(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    seed_permission(db_session, "MANAGE_USERS")
    seed_permission(db_session, "ASSIGN_ROLES")

    # Act
    response = api_client.get("/users/permissions/list", headers=auth_headers(admin))

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert {"MANAGE_USERS", "ASSIGN_ROLES"}.issubset({item["code"] for item in response.json()})


def test_update_permissions_replaces_direct_permissions(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    target = seed_user(db_session, role_names=["EVALUADOR"])
    seed_permission(db_session, "MANAGE_USERS")

    # Act
    response = api_client.put(
        f"/users/{target.id}/permissions",
        headers=auth_headers(admin),
        json=["MANAGE_USERS"],
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Permissions updated successfully"


def test_update_permissions_can_clear_direct_permissions(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    target = seed_user(db_session, direct_permission_codes=["MANAGE_USERS"])

    # Act
    response = api_client.put(
        f"/users/{target.id}/permissions",
        headers=auth_headers(admin),
        json=[],
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Permissions updated successfully"


def test_update_permissions_returns_404_for_missing_user(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.put("/users/9999/permissions", headers=auth_headers(admin), json=[])

    # Assert
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "User not found"


def test_update_permissions_requires_assign_global_permissions(api_client, db_session):
    # Arrange
    user_without_permission = seed_user(db_session, role_names=["EVALUADOR"])
    target = seed_user(db_session, role_names=["EVALUADOR"])

    # Act
    response = api_client.put(
        f"/users/{target.id}/permissions",
        headers=auth_headers(user_without_permission),
        json=["MANAGE_USERS"],
    )

    # Assert
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions. Required: ASSIGN_GLOBAL_PERMISSIONS"
