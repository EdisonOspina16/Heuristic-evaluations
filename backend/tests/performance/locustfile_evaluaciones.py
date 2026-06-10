from random import randint
from uuid import uuid4

from locust import HttpUser, between, task


PLANTILLA_ID = 1
PROJECT_ID = 10
EVALUADOR_ID = 5


def make_respuestas(count: int, *, warnings: bool = False):
    respuestas = []
    for index in range(count):
        pregunta_id = index + 1
        if warnings and index % 3 == 0:
            respuestas.append(
                {
                    "pregunta_id": pregunta_id,
                    "opcion_id": 3,
                    "comentario": f"Hallazgo critico perf {pregunta_id}",
                }
            )
        else:
            respuestas.append(
                {
                    "pregunta_id": pregunta_id,
                    "valor_numerico": str((index % 5) + 1),
                    "comentario": f"Respuesta perf {pregunta_id}",
                }
            )
    return respuestas


def make_submit_payload(response_count: int, *, warnings: bool = False):
    suffix = uuid4().hex[:8]
    return {
        "plantilla_id": PLANTILLA_ID,
        "proyecto_id": PROJECT_ID,
        "evaluador_id": EVALUADOR_ID,
        "perfil": f"Performance evaluator {suffix}",
        "estudios": "Performance suite",
        "respuestas": make_respuestas(response_count, warnings=warnings),
    }


def make_progress_payload(response_count: int, *, evaluation_id: int | None = None):
    return {
        "evaluation_id": evaluation_id,
        "plantilla_id": PLANTILLA_ID,
        "proyecto_id": PROJECT_ID,
        "evaluador_id": EVALUADOR_ID,
        "respuestas": make_respuestas(response_count),
        "status": "incomplete",
    }


class EvaluacionesPerformanceUser(HttpUser):
    wait_time = between(1, 3)

    @task(4)
    def registrar_evaluacion_con_100_respuestas(self):
        with self.client.post(
            "/evaluaciones/",
            json=make_submit_payload(100),
            name="[EVALUACIONES] Registrar 100 respuestas",
            catch_response=True,
        ) as response:
            if response.status_code in (200, 400):
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")

    @task(2)
    def registrar_evaluacion_con_500_respuestas(self):
        with self.client.post(
            "/evaluaciones/",
            json=make_submit_payload(500),
            name="[EVALUACIONES] Registrar 500 respuestas",
            catch_response=True,
        ) as response:
            if response.status_code in (200, 400):
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")

    @task(3)
    def registrar_evaluacion_multiples_dimensiones(self):
        with self.client.post(
            "/evaluaciones/",
            json=make_submit_payload(120),
            name="[EVALUACIONES] Multiples dimensiones",
            catch_response=True,
        ) as response:
            if response.status_code in (200, 400):
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")

    @task(3)
    def registrar_evaluacion_multiples_warnings(self):
        with self.client.post(
            "/evaluaciones/",
            json=make_submit_payload(150, warnings=True),
            name="[EVALUACIONES] Multiples warnings",
            catch_response=True,
        ) as response:
            if response.status_code in (200, 400):
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")

    @task(5)
    def guardado_concurrente_de_borradores(self):
        evaluation_id = randint(1, 1000)
        with self.client.patch(
            "/evaluaciones/progress",
            json=make_progress_payload(100, evaluation_id=evaluation_id),
            name="[EVALUACIONES] Guardado concurrente borrador",
            catch_response=True,
        ) as response:
            if response.status_code in (200, 400):
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")

    @task(4)
    def calculo_concurrente_de_resultados(self):
        with self.client.post(
            "/evaluaciones/",
            json=make_submit_payload(100, warnings=True),
            name="[EVALUACIONES] Calculo concurrente resultados",
            catch_response=True,
        ) as response:
            if response.status_code in (200, 400):
                response.success()
            else:
                response.failure(f"Unexpected response: {response.status_code} {response.text}")
