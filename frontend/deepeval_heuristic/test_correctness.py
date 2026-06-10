# -*- coding: utf-8 -*-
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, SingleTurnParams
from deepeval.metrics import GEval
from common import (
    FORM_LOAD, LIKERT_SELECT, LIKERT_DESELECT,
    SELECTION_SELECT, SELECTION_DESELECT, COMMENT_INPUT,
    MANUAL_SAVE, AUTOSAVE, FORM_SUBMIT, FORM_ERROR,
)
from models import get_model

model = get_model()


@pytest.mark.parametrize("test_case", [
    LLMTestCase(
        input="El agente navegó a /evaluacion/1 y verificó la estructura inicial del formulario.",
        actual_output=FORM_LOAD,
        expected_output=(
            "El formulario cargó con un h1 visible, al menos una dimensión, "
            "barra de progreso en 0, contador en formato N/M, "
            "y el botón Finalizar Evaluación visible y habilitado."
        ),
    ),
    LLMTestCase(
        input="El agente seleccionó el valor 3 en la primera pregunta Likert.",
        actual_output=LIKERT_SELECT,
        expected_output=(
            "El hidden input de la pregunta actualizó su value a '3' "
            "y el contador de respondidas incrementó en 1."
        ),
    ),
    LLMTestCase(
        input="El agente hizo clic nuevamente sobre el valor 3 ya seleccionado.",
        actual_output=LIKERT_DESELECT,
        expected_output=(
            "El hidden input volvió a value vacío, "
            "confirmando que el toggle de deselección funciona."
        ),
    ),
    LLMTestCase(
        input="El agente seleccionó la primera opción de una pregunta de selección múltiple.",
        actual_output=SELECTION_SELECT,
        expected_output=(
            "El hidden input registró un opcion_id numérico no vacío "
            "correspondiente a la opción seleccionada."
        ),
    ),
    LLMTestCase(
        input="El agente hizo clic nuevamente sobre la misma opción de selección.",
        actual_output=SELECTION_DESELECT,
        expected_output=(
            "El hidden input volvió a value vacío, "
            "confirmando que la deselección de opciones funciona."
        ),
    ),
    LLMTestCase(
        input="El agente escribió texto en el primer textarea de comentarios.",
        actual_output=COMMENT_INPUT,
        expected_output=(
            "El textarea persistió el texto escrito y el contador de respondidas "
            "incrementó, indicando que los comentarios cuentan como respuesta."
        ),
    ),
    LLMTestCase(
        input="El agente hizo clic en el botón Guardar progreso manualmente.",
        actual_output=MANUAL_SAVE,
        expected_output=(
            "El texto de estado cambió a 'Progreso guardado HH:MM:SS' "
            "tras la confirmación del backend."
        ),
    ),
    LLMTestCase(
        input="El agente respondió una pregunta y esperó el autosave por debounce.",
        actual_output=AUTOSAVE,
        expected_output=(
            "El autosave se disparó automáticamente tras 700ms y el texto "
            "de estado actualizó a 'Progreso guardado HH:MM:SS'."
        ),
    ),
    LLMTestCase(
        input="El agente respondió todas las preguntas y envió el formulario.",
        actual_output=FORM_SUBMIT,
        expected_output=(
            "El progreso llegó al 100%, el botón de envío fue accionado "
            "y la URL navegó a una ruta de confirmación válida."
        ),
    ),
    LLMTestCase(
        input="El agente navegó a /evaluacion/9999 con un ID de plantilla inexistente.",
        actual_output=FORM_ERROR,
        expected_output=(
            "El componente mostró data-cy='error-message' con texto de error "
            "no vacío en lugar del formulario."
        ),
    ),
])
def test_correctness(test_case):
    metric = GEval(
        name="Correctness EvaluationForm",
        model=model,
        criteria=(
            "Determina si el output del agente Stagehand refleja correctamente "
            "el resultado esperado de la interacción con el formulario de evaluación heurística. "
            "Considera: estado del DOM, valores de hidden inputs, navegación de URL "
            "y feedback visual al usuario."
        ),
        evaluation_params=[
            SingleTurnParams.INPUT,
            SingleTurnParams.ACTUAL_OUTPUT,
            SingleTurnParams.EXPECTED_OUTPUT,
        ],
        threshold=0.2,
    )
    assert_test(test_case, [metric])
