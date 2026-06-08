from uuid import uuid4

from locust import HttpUser, between, task


ADMIN_USER = {
    "email": "admin@example.com",
    "password": "Secret123!",
}


class UserManagementAdmin(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        response = self.client.post("/auth/login", json=ADMIN_USER, name="[SETUP] Login admin")
        self.token = response.json().get("access_token") if response.status_code == 200 else None
        self.headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(8)
    def list_users(self):
        with self.client.get(
            "/users/",
            headers=self.headers,
            name="[USERS] Directorio general",
            catch_response=True,
        ) as response:
            if response.status_code == 200 and isinstance(response.json(), list):
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")

    @task(3)
    def create_user_as_admin(self):
        suffix = uuid4().hex
        payload = {
            "nombre": f"Perf User {suffix[:8]}",
            "email": f"perf-{suffix}@example.com",
            "password": "Secret123!",
        }
        with self.client.post(
            "/users/?role_name=EVALUADOR",
            headers=self.headers,
            json=payload,
            name="[USERS] Crear usuario",
            catch_response=True,
        ) as response:
            if response.status_code == 200 and response.json().get("email") == payload["email"]:
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")

    @task(2)
    def reject_missing_user_status_update(self):
        with self.client.patch(
            "/users/999999/status?active=false",
            headers=self.headers,
            name="[USERS] Estado usuario inexistente",
            catch_response=True,
        ) as response:
            if response.status_code == 404:
                response.success()
            else:
                response.failure(f"Expected 404, got {response.status_code}")

    @task(2)
    def reject_missing_user_delete(self):
        with self.client.delete(
            "/users/999999",
            headers=self.headers,
            name="[USERS] Eliminar usuario inexistente",
            catch_response=True,
        ) as response:
            if response.status_code == 404:
                response.success()
            else:
                response.failure(f"Expected 404, got {response.status_code}")

    @task(1)
    def reject_missing_user_role_update(self):
        with self.client.put(
            "/users/999999/roles",
            headers=self.headers,
            json=["EVALUADOR"],
            name="[USERS] Roles usuario inexistente",
            catch_response=True,
        ) as response:
            if response.status_code == 404:
                response.success()
            else:
                response.failure(f"Expected 404, got {response.status_code}")
