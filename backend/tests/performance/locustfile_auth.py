from locust import HttpUser, task, between, events
import time
import json

EXISTING_USER = {
   "nombre": "Cypress Tester",
    "email": "cypress.tester@example.com",
    "password": "Secret123!",
    "rol": "evaluador"
}
    
def make_user() -> dict:

    suffix = f"{int(time.time() * 1000)}"
    return {
        "nombre": f"Perf User {suffix}",
        "email": f"perf.{suffix}@test.com",
        "password": "Secret123!",
        "rol": "evaluador"
    }


class LoginUser(HttpUser):

    wait_time = between(1, 3)
    weight = 3  # más frecuente

 #Login con credenciales válidas
    @task(5)
    def login_valido(self):
        with self.client.post(
            "/auth/login",
            json={
                "email": EXISTING_USER["email"],
                "password": EXISTING_USER["password"]
            },
            name="[AUTH-LOGIN]  Login válido",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                
                if "access_token" not in data:
                    response.failure("Falta access_token en la respuesta")
                elif "user" not in data:
                    response.failure("Falta user en la respuesta")
                elif data["user"]["email"] != EXISTING_USER["email"]:
                    response.failure("Email en respuesta no coincide")
                else:
                    response.success()
            else:
                response.failure(f"Esperado 200, recibido {response.status_code}")

    #Login con email inexistente 
    @task(2)
    def login_email_inexistente(self):
        with self.client.post(
            "/auth/login",
            json={
                "email": "noexiste@test.com",
                "password": "Secret123!"
            },
            name="[AUTH-LOGIN] Email inexistente",
            catch_response=True
        ) as response:
            
            if response.status_code == 401:
                data = response.json()
                if data.get("detail") == "Incorrect email or password":
                    response.success()
                else:
                    response.failure(f"Mensaje de error inesperado: {data}")
            else:
                response.failure(f"Esperado 401, recibido {response.status_code}")

    # Login con contraseña incorrecta 
    @task(2)
    def login_password_incorrecto(self):
        with self.client.post(
            "/auth/login",
            json={
                "email": EXISTING_USER["email"],
                "password": "WrongPassword999!"
            },
            name="[AUTH-LOGIN]  Password incorrecto",
            catch_response=True
        ) as response:
            if response.status_code == 401:
                data = response.json()
                if data.get("detail") == "Incorrect email or password":
                    response.success()
                else:
                    response.failure(f"Mensaje inesperado: {data}")
            else:
                response.failure(f"Esperado 401, recibido {response.status_code}")

    # Login con body vacío 
    @task(1)
    def login_body_vacio(self):
        with self.client.post(
            "/auth/login",
            json={},
            name="[AUTH-LOGIN]  Body vacío",
            catch_response=True
        ) as response:
            
            if response.status_code == 422:
                response.success()
            else:
                response.failure(f"Esperado 422, recibido {response.status_code}")

    # Login con email malformado ─
    @task(1)
    def login_email_malformado(self):
        with self.client.post(
            "/auth/login",
            json={
                "email": "esto-no-es-un-email",
                "password": "Secret123!"
            },
            name="[AUTH-LOGIN]  Email malformado",
            catch_response=True
        ) as response:
            
            if response.status_code in [422, 401]:
                response.success()
            else:
                response.failure(f"Esperado 422 o 401, recibido {response.status_code}")


 
class RegisterUser(HttpUser):
   
    wait_time = between(2, 5)
    weight = 1  

    #  Registro exitoso con datos válidos 
    @task(5)
    def register_valido(self):
        user = make_user()
        with self.client.post(
            "/auth/register",
            json=user,
            name="[AUTH-REGISTER] Registro válido",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "id" not in data:
                    response.failure("Falta id en la respuesta")
                elif data.get("email") != user["email"]:
                    response.failure("Email en respuesta no coincide")
                else:
                    response.success()
            else:
                response.failure(f"Esperado 200, recibido {response.status_code}: {response.text}")

    #  Registro con email duplicado 
    @task(3)
    def register_email_duplicado(self):
        with self.client.post(
            "/auth/register",
            json={
                "nombre": EXISTING_USER["nombre"],
                "email": EXISTING_USER["email"],  # ya existe
                "password": EXISTING_USER["password"],
                "rol": "evaluador"
            },
            name="[AUTH-REGISTER]  Email duplicado",
            catch_response=True
        ) as response:
            if response.status_code == 400:
                data = response.json()
                if data.get("detail") == "Email already registered":
                    response.success()
                else:
                    response.failure(f"Mensaje inesperado: {data}")
            else:
                response.failure(f"Esperado 400, recibido {response.status_code}")

    #  Registro con body vacío 
    @task(1)
    def register_body_vacio(self):
        with self.client.post(
            "/auth/register",
            json={},
            name="[AUTH-REGISTER]  Body vacío",
            catch_response=True
        ) as response:
            if response.status_code == 422:
                response.success()
            else:
                response.failure(f"Esperado 422, recibido {response.status_code}")

    # Registro sin campo nombre 
    @task(1)
    def register_sin_nombre(self):
        suffix = int(time.time() * 1000)
        with self.client.post(
            "/auth/register",
            json={
                "email": f"sinombre.{suffix}@test.com",
                "password": "Secret123!",
                "rol": "evaluador"
                # nombre ausente
            },
            name="[AUTH-REGISTER]  Sin nombre",
            catch_response=True
        ) as response:
            if response.status_code == 422:
                response.success()
            else:
                response.failure(f"Esperado 422, recibido {response.status_code}")


#  Logout 

class LogoutUser(HttpUser):

    wait_time = between(3, 6)
    weight = 1

    def on_start(self):
       
        response = self.client.post(
            "/auth/login",
            json={
                "email": EXISTING_USER["email"],
                "password": EXISTING_USER["password"]
            },
            name="[SETUP] Login previo"
        )
        self.token = response.json().get("access_token") if response.status_code == 200 else None

    #  Logout con token válido 
    @task(3)
    def logout_con_token(self):
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        with self.client.post(
            "/auth/logout",
            headers=headers,
            name="[AUTH-LOGOUT]  Logout con token",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Logged out successfully":
                    response.success()
                else:
                    response.failure(f"Mensaje inesperado: {data}")
            else:
                response.failure(f"Esperado 200, recibido {response.status_code}")

    # Logout sin token 
    @task(1)
    def logout_sin_token(self):
        with self.client.post(
            "/auth/logout",
            name="[AUTH-LOGOUT]  Logout sin token",
            catch_response=True
        ) as response:
            
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Esperado 200, recibido {response.status_code}")


# Flujo completo 

class FullAuthFlowUser(HttpUser):
    
    wait_time = between(2, 4)
    weight = 2

    #  Flujo completo 
    @task
    def flujo_completo(self):
        user = make_user()

        #  Register
        with self.client.post(
            "/auth/register",
            json=user,
            name="[FLUJO]  Step 1 Register",
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Register falló: {response.status_code}")
                return
            response.success()

        #  Login
        token = None
        with self.client.post(
            "/auth/login",
            json={
                "email": user["email"],
                "password": user["password"]
            },
            name="[FLUJO]  Step 2 Login",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                token = response.json().get("access_token")
                response.success()
            else:
                response.failure(f"Login falló: {response.status_code}")
                return

        # Logout
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        with self.client.post(
            "/auth/logout",
            headers=headers,
            name="[FLUJO]  Step 3 Logout",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Logout falló: {response.status_code}")