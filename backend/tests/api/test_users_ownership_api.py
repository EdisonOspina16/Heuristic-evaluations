from fastapi import status

from user_management_api_helpers import auth_headers, seed_admin, seed_user


def test_public_registration_always_grants_admin_with_no_owner(api_client, db_session):
    # Arrange: precondición para que /auth/register asigne el rol ADMIN.
    seed_admin(db_session)
    seed_user(db_session, role_names=["EVALUADOR"])

    # Act
    response = api_client.post(
        "/auth/register",
        json={"nombre": "Auto Registrado", "email": "auto-registrado@example.com", "password": "Secret123!"},
    )

    # Assert
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["roles"][0]["name"] == "ADMIN"
    assert body["creado_por"] is None


def test_admin_cannot_see_users_created_by_another_admin(api_client, db_session):
    # Arrange
    admin_a = seed_admin(db_session)
    admin_b = seed_user(db_session, nombre="Otro Admin", email="otro-admin@example.com", role_names=["ADMIN"])
    seed_user(db_session, nombre="De A", email="de-a@example.com", role_names=["EVALUADOR"], created_by=admin_a.id)
    seed_user(db_session, nombre="De B", email="de-b@example.com", role_names=["EVALUADOR"], created_by=admin_b.id)

    # Act
    response_a = api_client.get("/users/", headers=auth_headers(admin_a))
    response_b = api_client.get("/users/", headers=auth_headers(admin_b))

    # Assert
    assert {item["email"] for item in response_a.json()} == {"de-a@example.com"}
    assert {item["email"] for item in response_b.json()} == {"de-b@example.com"}


def test_admin_cannot_manage_a_user_created_by_another_admin(api_client, db_session):
    # Arrange
    owner = seed_admin(db_session)
    other_admin = seed_user(db_session, nombre="Otro Admin", email="otro-admin-2@example.com", role_names=["ADMIN"])
    target = seed_user(db_session, nombre="De Owner", email="de-owner@example.com", role_names=["EVALUADOR"], created_by=owner.id)

    # Act
    status_response = api_client.patch(f"/users/{target.id}/status?active=false", headers=auth_headers(other_admin))
    delete_response = api_client.delete(f"/users/{target.id}", headers=auth_headers(other_admin))
    roles_response = api_client.put(f"/users/{target.id}/roles", headers=auth_headers(other_admin), json=["ADMIN"])
    permissions_response = api_client.put(f"/users/{target.id}/permissions", headers=auth_headers(other_admin), json=[])

    # Assert
    assert status_response.status_code == status.HTTP_404_NOT_FOUND
    assert delete_response.status_code == status.HTTP_404_NOT_FOUND
    assert roles_response.status_code == status.HTTP_404_NOT_FOUND
    assert permissions_response.status_code == status.HTTP_404_NOT_FOUND


def test_admin_can_still_manage_own_account(api_client, db_session):
    # Arrange: la aislación entre "burbujas" no debe bloquear que un admin
    # gestione su propia cuenta (creado_por=None, no la creó nadie).
    admin = seed_admin(db_session)

    # Act: reactivar la propia cuenta no dispara la protección de "último
    # admin" (esa solo aplica al desactivar), así que si el self-bypass de
    # ownership funciona, esto debe pasar en 200 en vez de 404.
    reactivate_self_response = api_client.patch(f"/users/{admin.id}/status?active=true", headers=auth_headers(admin))
    # Desactivarse a sí mismo sigue sujeto a la regla de negocio existente
    # (no se puede quedar el sistema sin administradores activos).
    deactivate_self_response = api_client.patch(f"/users/{admin.id}/status?active=false", headers=auth_headers(admin))

    # Assert
    assert reactivate_self_response.status_code == status.HTTP_200_OK
    assert deactivate_self_response.status_code == status.HTTP_400_BAD_REQUEST


def test_admin_cannot_manage_another_admins_own_account(api_client, db_session):
    # Arrange: dos admins independientes, ninguno creado por el otro.
    admin_a = seed_admin(db_session)
    admin_b = seed_user(db_session, role_names=["ADMIN"])

    # Act
    cross_status_response = api_client.patch(f"/users/{admin_a.id}/status?active=false", headers=auth_headers(admin_b))

    # Assert
    assert cross_status_response.status_code == status.HTTP_404_NOT_FOUND


def test_created_user_is_visible_to_and_manageable_by_its_creator(api_client, db_session):
    # Arrange
    admin = seed_admin(db_session)

    # Act: el admin crea un evaluador desde el panel.
    create_response = api_client.post(
        "/users/?role_name=EVALUADOR",
        headers=auth_headers(admin),
        json={"nombre": "Nuevo Evaluador", "email": "nuevo-evaluador@example.com", "password": "Secret123!"},
    )
    created_id = create_response.json()["id"]
    list_response = api_client.get("/users/", headers=auth_headers(admin))
    manage_response = api_client.patch(f"/users/{created_id}/status?active=false", headers=auth_headers(admin))

    # Assert
    assert create_response.status_code == status.HTTP_200_OK
    assert create_response.json()["creado_por"] == admin.id
    assert created_id in {item["id"] for item in list_response.json()}
    assert manage_response.status_code == status.HTTP_200_OK
    assert manage_response.json()["active"] is False
