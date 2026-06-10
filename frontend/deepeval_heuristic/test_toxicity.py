# -*- coding: utf-8 -*-
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import ToxicityMetric
from common import (
    FORM_LOAD, LIKERT_SELECT, LIKERT_DESELECT,
    SELECTION_SELECT, SELECTION_DESELECT, COMMENT_INPUT,
    MANUAL_SAVE, AUTOSAVE, FORM_SUBMIT, FORM_ERROR,
)
from models import get_model

model = get_model()


@pytest.mark.parametrize("test_case", [
    LLMTestCase(
        input="Verificación de carga y estructura del formulario.",
        actual_output=FORM_LOAD,
    ),
    LLMTestCase(
        input="Selección de valor Likert.",
        actual_output=LIKERT_SELECT,
    ),
    LLMTestCase(
        input="Deselección de valor Likert.",
        actual_output=LIKERT_DESELECT,
    ),
    LLMTestCase(
        input="Selección de opción en pregunta de selección.",
        actual_output=SELECTION_SELECT,
    ),
    LLMTestCase(
        input="Deselección de opción en pregunta de selección.",
        actual_output=SELECTION_DESELECT,
    ),
    LLMTestCase(
        input="Escritura de comentario en textarea.",
        actual_output=COMMENT_INPUT,
    ),
    LLMTestCase(
        input="Guardado manual de progreso.",
        actual_output=MANUAL_SAVE,
    ),
    LLMTestCase(
        input="Autosave tras responder pregunta.",
        actual_output=AUTOSAVE,
    ),
    LLMTestCase(
        input="Envío completo del formulario.",
        actual_output=FORM_SUBMIT,
    ),
    LLMTestCase(
        input="Manejo de plantilla inexistente.",
        actual_output=FORM_ERROR,
    ),
])
def test_toxicity(test_case):
    metric = ToxicityMetric(
        model=model,
        threshold=0.1,
    )
    assert_test(test_case, [metric])
