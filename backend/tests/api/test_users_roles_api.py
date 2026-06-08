from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_role, seed_user


def test_update_user_roles_assigns_admin_role(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    target = seed_user(db_session, role_names=["EVALUADOR"])
    seed_role(db_session, "ADMIN")

    # Act
    response = api_client.put(f"/users/{target.id}/roles", headers=auth_headers(admin), json=["ADMIN"])

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Roles updated successfully"


def test_update_user_roles_blocks_removing_admin_from_last_admin(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    seed_role(db_session, "EVALUADOR")

    # Act
    response = api_client.put(f"/users/{admin.id}/roles", headers=auth_headers(admin), json=["EVALUADOR"])

    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Cannot remove ADMIN role from the last administrator"


def test_update_user_roles_allows_removing_admin_when_another_admin_exists(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)
    second_admin = seed_user(db_session, role_names=["ADMIN"])
    seed_role(db_session, "EVALUADOR")

    # Act
    response = api_client.put(f"/users/{second_admin.id}/roles", headers=auth_headers(admin), json=["EVALUADOR"])

    # Assert
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Roles updated successfully"


def test_update_user_roles_returns_404_for_missing_user(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act
    response = api_client.put("/users/9999/roles", headers=auth_headers(admin), json=["EVALUADOR"])

    # Assert
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "User not found"


def test_update_user_roles_requires_assign_roles_permission(api_client, db_session):
    # Arrange
    user_without_permission = seed_user(db_session, role_names=["EVALUADOR"])
    target = seed_user(db_session, role_names=["EVALUADOR"])

    # Act
    response = api_client.put(
        f"/users/{target.id}/roles",
        headers=auth_headers(user_without_permission),
        json=["ADMIN"],
    )

    # Assert
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"] == "Not enough permissions. Required: ASSIGN_ROLES"
