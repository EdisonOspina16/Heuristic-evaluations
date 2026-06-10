# -*- coding: utf-8 -*-
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import TaskCompletionMetric
from common import FORM_LOAD, MANUAL_SAVE, AUTOSAVE, FORM_SUBMIT, FORM_ERROR
from models import get_model

model = get_model()


@pytest.mark.parametrize("test_case", [
    LLMTestCase(
        input=(
            "Tarea: verificar que el formulario de evaluación heurística carga correctamente "
            "con todos sus elementos estructurales (título, dimensiones, progreso, botón de envío)."
        ),
        actual_output=FORM_LOAD,
    ),
    LLMTestCase(
        input=(
            "Tarea: completar todas las preguntas del formulario (Likert y selección), "
            "alcanzar el 100% de progreso y enviar la evaluación exitosamente."
        ),
        actual_output=FORM_SUBMIT,
    ),
    LLMTestCase(
        input=(
            "Tarea: guardar manualmente el progreso de la evaluación "
            "y confirmar que el sistema acusó recibo del guardado."
        ),
        actual_output=MANUAL_SAVE,
    ),
    LLMTestCase(
        input=(
            "Tarea: responder una pregunta y verificar que el autosave "
            "se dispara automáticamente sin intervención del usuario."
        ),
        actual_output=AUTOSAVE,
    ),
    LLMTestCase(
        input=(
            "Tarea: navegar a una evaluación con ID inexistente "
            "y verificar que el sistema muestra un mensaje de error adecuado."
        ),
        actual_output=FORM_ERROR,
    ),
])
def test_task_completion(test_case):
    metric = TaskCompletionMetric(
        model=model,
        threshold=0.5,
        verbose_mode=True,
    )
    assert_test(test_case, [metric])
