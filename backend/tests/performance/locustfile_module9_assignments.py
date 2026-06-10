from locust import HttpUser, between, task


class Module9AssignmentsUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.token = "performance-admin-token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.project_id = 10
        self.evaluator_id = 7

    @task(3)
    def list_projects_for_visibility(self):
        self.client.get("/projects/", headers=self.headers, name="Module9 list visible projects")

    @task(2)
    def list_project_assignments(self):
        self.client.get(
            f"/projects/{self.project_id}/assignments",
            headers=self.headers,
            name="Module9 list project assignments",
        )

    @task(1)
    def upsert_assignment(self):
        self.client.post(
            f"/projects/{self.project_id}/assignments",
            headers=self.headers,
            json={
                "evaluator_id": self.evaluator_id,
                "project_id": self.project_id,
                "role": "UX",
                "allowed_evaluation_types": ["UI", "UX", "Accesibilidad"],
            },
            name="Module9 upsert evaluator assignment",
        )
