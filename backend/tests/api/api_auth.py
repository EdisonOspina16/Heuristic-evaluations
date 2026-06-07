from uuid import uuid4

import jwt
import pytest
from fastapi import status
from fastapi.testclient import TestClient

from main import app
from src.application.services.auth_service import ALGORITHM, SECRET_KEY, get_password_hash
from src.infrastructure.database import DATABASE_URL, SessionLocal
from src.infrastructure.models import Permission, Role, User


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def db():
    print(f"Conectando a la base de datos en {DATABASE_URL}")   
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def created_rows(db):
    #Registra IDs creados y los elimina al finalizar cada test.
    created = {"users": [], "roles": [], "permissions": []}
    yield created

    if created["users"]:
        db.query(User).filter(
            User.id.in_(created["users"])
        ).delete(synchronize_session=False)
        db.commit()

    if created["roles"]:
        db.query(Role).filter(
            Role.id.in_(created["roles"])
        ).delete(synchronize_session=False)
        db.commit()

    if created["permissions"]:
        db.query(Permission).filter(
            Permission.id.in_(created["permissions"])
        ).delete(synchronize_session=False)
        db.commit()


def unique_email(prefix: str = "test") -> str:
    return f"{prefix}-{uuid4().hex}@example.com"


def ensure_role(db, created_rows, name: str, description: str | None = None) -> Role:
    role = db.query(Role).filter(Role.name == name).first()
    if role:
        return role
    role = Role(name=name, description=description or f"{name} role")
    db.add(role)
    db.flush()
    created_rows["roles"].append(role.id)
    db.commit()
    db.refresh(role)
    return role


def ensure_permission(db, created_rows, code: str, name: str | None = None) -> Permission:
    permission = db.query(Permission).filter(Permission.code == code).first()
    if permission:
        return permission
    permission = Permission(code=code, name=name or code, description=f"{code} permission")
    db.add(permission)
    db.flush()
    created_rows["permissions"].append(permission.id)
    db.commit()
    db.refresh(permission)
    return permission


def create_user(
    db,
    created_rows,
    *,
    nombre: str,
    email: str,
    password: str,
    active: bool = True,
    role_names: list[str] | None = None,
    permission_codes: list[str] | None = None,
) -> User:
    user = User(
        nombre=nombre,
        email=email,
        password_hash=get_password_hash(password),
        active=active,
    )
    db.add(user)
    db.flush()

    for role_name in role_names or []:
        role = ensure_role(db, created_rows, role_name)
        user.roles.append(role)

    for code in permission_codes or []:
        perm = ensure_permission(db, created_rows, code)
        user.direct_permissions.append(perm)

    db.commit()
    db.refresh(user)
    created_rows["users"].append(user.id)
    return user



# POST /auth/register

class TestRegister:

    def test_register_exitoso_retorna_200(self, client, db, created_rows):
        
        ensure_role(db, created_rows, "EVALUADOR")
        email = unique_email("r01")
        payload = {"nombre": "Juan Pérez", "email": email, "password": "Secret123!"}

        response = client.post("/auth/register", json=payload)


        assert response.status_code == status.HTTP_200_OK

      
        body = response.json()
        assert "id" in body
        assert body["email"] == email
        assert body["active"] is True
        assert "roles" in body

        created_rows["users"].append(body["id"])

   
    def test_register_no_expone_password_en_respuesta(self, client, db, created_rows):
        ensure_role(db, created_rows, "EVALUADOR")
        email = unique_email("r02")
        payload = {"nombre": "Juan", "email": email, "password": "Secret123!"}

        response = client.post("/auth/register", json=payload)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert "password" not in body
        assert "password_hash" not in body

        created_rows["users"].append(body["id"])

    
    def test_register_password_se_hashea_en_base_de_datos(self, client, db, created_rows):
        
        ensure_role(db, created_rows, "EVALUADOR")
        email = unique_email("r03")
        raw_password = "Secret123!"
        payload = {"nombre": "Juan", "email": email, "password": raw_password}

        response = client.post("/auth/register", json=payload)

        
        assert response.status_code == status.HTTP_200_OK

        
        db.expire_all()
        user_in_db = db.query(User).filter(User.email == email).first()
        assert user_in_db is not None
        assert user_in_db.password_hash != raw_password
        assert len(user_in_db.password_hash) > 20

        created_rows["users"].append(response.json()["id"])

   
    def test_register_usuario_queda_activo_por_defecto(self, client, db, created_rows):
        
        ensure_role(db, created_rows, "EVALUADOR")
        email = unique_email("r04")
        payload = {"nombre": "Juan", "email": email, "password": "Secret123!"}

     
        response = client.post("/auth/register", json=payload)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["active"] is True

        created_rows["users"].append(response.json()["id"])


    def test_register_email_duplicado_retorna_400(self, client, db, created_rows):
        
        email = unique_email("r05")
        create_user(
            db, created_rows,
            nombre="Existente", email=email,
            password="Secret123!", role_names=["EVALUADOR"],
        )

      
        response = client.post("/auth/register", json={
            "nombre": "Otro Usuario",
            "email": email,
            "password": "OtraPass123!",
        })

       
        assert response.status_code == status.HTTP_400_BAD_REQUEST


        body = response.json()
        assert "detail" in body
        assert body["detail"] == "Email already registered"


    def test_register_body_vacio_retorna_422(self, client):
        
        response = client.post("/auth/register", json={})

        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert "detail" in response.json()

    def test_register_sin_nombre_retorna_422(self, client):
     
        payload = {"email": unique_email("r07"), "password": "Secret123!"}

     
        response = client.post("/auth/register", json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

   
    def test_register_sin_email_retorna_422(self, client):
       
        payload = {"nombre": "Juan", "password": "Secret123!"}

        response = client.post("/auth/register", json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    def test_register_sin_password_retorna_422(self, client):
 
        payload = {"nombre": "Juan", "email": unique_email("r09")}

        response = client.post("/auth/register", json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    def test_register_email_malformado_retorna_422(self, client):
      
        payload = {
            "nombre": "Juan",
            "email": "esto-no-es-un-email",
            "password": "Secret123!",
        }
   
        response = client.post("/auth/register", json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT



class TestLogin:
    def test_login_exitoso_retorna_200_con_token(self, client, db, created_rows):
    
        email = unique_email("l01")
        password = "Secret123!"
        create_user(
            db, created_rows,
            nombre="Login OK", email=email,
            password=password, role_names=["EVALUADOR"],
        )

        response = client.post("/auth/login", json={"email": email, "password": password})

        assert response.status_code == status.HTTP_200_OK

        body = response.json()
        assert "access_token" in body
        assert "token_type" in body
        assert "user" in body
        assert body["token_type"] == "bearer"

  
    def test_login_token_jwt_contiene_claims_correctos(self, client, db, created_rows):

        email = unique_email("l02")
        password = "Secret123!"
        user = create_user(
            db, created_rows,
            nombre="Claims Test", email=email,
            password=password, role_names=["EVALUADOR"],
        )

        response = client.post("/auth/login", json={"email": email, "password": password})

        body = response.json()
        decoded = jwt.decode(body["access_token"], SECRET_KEY, algorithms=[ALGORITHM])

        assert decoded["sub"] == email
        assert decoded["id"] == user.id
        assert "rol" in decoded
        assert "permissions" in decoded
        assert isinstance(decoded["permissions"], list)

    def test_login_respuesta_user_contiene_todos_los_campos(self, client, db, created_rows):
       
        email = unique_email("l03")
        password = "Secret123!"
        user = create_user(
            db, created_rows,
            nombre="Campos Test", email=email,
            password=password, role_names=["EVALUADOR"],
        )

        response = client.post("/auth/login", json={"email": email, "password": password})


        body = response.json()
        user_data = body["user"]
        assert user_data["id"] == user.id
        assert user_data["nombre"] == "Campos Test"
        assert user_data["email"] == email
        assert "rol" in user_data
        assert user_data["active"] is True
        assert isinstance(user_data["permissions"], list)


    def test_login_incluye_permisos_de_rol_y_directos(self, client, db, created_rows):
        
        email = unique_email("l04")
        password = "Secret123!"

        admin_role = ensure_role(db, created_rows, "ADMIN")
        role_perm = ensure_permission(db, created_rows, "MANAGE_USERS")
        direct_perm = ensure_permission(db, created_rows, "CREATE_PROJECTS")

        if role_perm not in admin_role.permissions:
            admin_role.permissions.append(role_perm)
            db.commit()
            db.refresh(admin_role)

        user = create_user(
            db, created_rows,
            nombre="Perms Test", email=email,
            password=password, role_names=["ADMIN"],
            permission_codes=["CREATE_PROJECTS"],
        )

        if direct_perm not in user.direct_permissions:
            user.direct_permissions.append(direct_perm)
            db.commit()

     
        response = client.post("/auth/login", json={"email": email, "password": password})

        
        body = response.json()
        perms = set(body["user"]["permissions"])
        assert "MANAGE_USERS" in perms
        assert "CREATE_PROJECTS" in perms

  
        decoded = jwt.decode(body["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
        decoded_perms = set(decoded["permissions"])
        assert "MANAGE_USERS" in decoded_perms
        assert "CREATE_PROJECTS" in decoded_perms


    def test_login_usuario_sin_roles_usa_evaluador_por_defecto(self, client, db, created_rows):
        
        email = unique_email("l05")
        password = "Secret123!"
        create_user(
            db, created_rows,
            nombre="Sin Roles", email=email,
            password=password, role_names=[],
        )

      
        response = client.post("/auth/login", json={"email": email, "password": password})

     
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["user"]["rol"] == "EVALUADOR"

    
    def test_login_password_incorrecto_retorna_401(self, client, db, created_rows):
        
        email = unique_email("l06")
        create_user(
            db, created_rows,
            nombre="Wrong Pass", email=email,
            password="Secret123!", role_names=["EVALUADOR"],
        )

        
        response = client.post("/auth/login", json={
            "email": email, "password": "PasswordIncorrecto999!",
        })

    
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        assert response.json()["detail"] == "Incorrect email or password"


        assert "www-authenticate" in response.headers
        assert response.headers["www-authenticate"] == "Bearer"

    def test_login_email_inexistente_retorna_401(self, client):
      
        payload = {"email": unique_email("l07-no-existe"), "password": "Secret123!"}

        response = client.post("/auth/login", json=payload)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Incorrect email or password"

  
    def test_login_usuario_inactivo_retorna_403(self, client, db, created_rows):
        
        email = unique_email("l08")
        create_user(
            db, created_rows,
            nombre="Inactivo", email=email,
            password="Secret123!", active=False,
            role_names=["EVALUADOR"],
        )

      
        response = client.post("/auth/login", json={"email": email, "password": "Secret123!"})

      
        assert response.status_code == status.HTTP_403_FORBIDDEN

       
        assert response.json()["detail"] == "User account is inactive"
        assert "www-authenticate" in response.headers

  
    def test_login_body_vacio_retorna_422(self, client):
        
        response = client.post("/auth/login", json={})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert "detail" in response.json()


    def test_login_sin_email_retorna_422(self, client):
    
        payload = {"password": "Secret123!"}

        response = client.post("/auth/login", json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


    def test_login_sin_password_retorna_422(self, client):
        payload = {"email": unique_email("l11")}

        response = client.post("/auth/login", json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


class TestLogout:
    def test_logout_retorna_200_y_mensaje_correcto(self, client):
       
        response = client.post("/auth/logout")

        assert response.status_code == status.HTTP_200_OK

        body = response.json()
        assert "message" in body
        assert body["message"] == "Logged out successfully"

    def test_logout_respuesta_es_json_valido(self, client):
   
        response = client.post("/auth/logout")

        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response.headers["content-type"]
        assert isinstance(response.json(), dict)