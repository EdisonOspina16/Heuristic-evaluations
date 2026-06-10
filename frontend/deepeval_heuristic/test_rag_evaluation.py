# -*- coding: utf-8 -*-
"""
RAG evaluation — skipped hasta que el backend implemente POST /api/rag/query.

Para activar:
  1. Quitar @pytest.mark.skip de cada test.
  2. Reemplazar los RAG_CASES con llamadas reales al endpoint.
"""
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import (
    ContextualPrecisionMetric,
    ContextualRecallMetric,
    FaithfulnessMetric,
)
from models import get_model

model = get_model()

RAG_CASES = [
    LLMTestCase(
        input="¿Qué heurísticas de Nielsen son más relevantes para evaluar un formulario?",
        actual_output=(
            "Las heurísticas más relevantes son visibilidad del estado del sistema, "
            "control y libertad del usuario, y prevención de errores."
        ),
        expected_output=(
            "Las heurísticas de Nielsen aplicables a formularios incluyen visibilidad "
            "del estado, control del usuario y prevención de errores."
        ),
        retrieval_context=[
            "Heurística 1: el sistema debe mantener informados a los usuarios sobre lo que ocurre.",
            "Heurística 3: los usuarios necesitan salidas de emergencia claramente marcadas.",
            "Heurística 5: un diseño cuidadoso evita que ocurran problemas.",
        ],
    ),
    LLMTestCase(
        input="¿Cómo se calcula el porcentaje de progreso de una evaluación heurística?",
        actual_output=(
            "El progreso es (preguntas respondidas / total) * 100, redondeado al entero. "
            "Se considera respondida si tiene valor_numerico, opcion_id o comentario no vacío."
        ),
        expected_output=(
            "El progreso es el porcentaje de preguntas respondidas sobre el total, "
            "considerando Likert, selección y comentarios como válidos."
        ),
        retrieval_context=[
            "answeredQuestions filtra respuestas con valor_numerico, opcion_id o comentario.",
            "progressPercent = Math.round((answeredQuestions / totalQuestions) * 100)",
        ],
    ),
]


@pytest.mark.skip(reason="RAG no implementado — activar cuando exista POST /api/rag/query")
@pytest.mark.parametrize("test_case", RAG_CASES)
def test_rag_contextual_precision(test_case):
    metric = ContextualPrecisionMetric(model=model, threshold=0.2, verbose_mode=True)
    assert_test(test_case, [metric])


@pytest.mark.skip(reason="RAG no implementado — activar cuando exista POST /api/rag/query")
@pytest.mark.parametrize("test_case", RAG_CASES)
def test_rag_contextual_recall(test_case):
    metric = ContextualRecallMetric(model=model, threshold=0.2, verbose_mode=True)
    assert_test(test_case, [metric])


@pytest.mark.skip(reason="RAG no implementado — activar cuando exista POST /api/rag/query")
@pytest.mark.parametrize("test_case", RAG_CASES)
def test_rag_faithfulness(test_case):
    metric = FaithfulnessMetric(model=model, threshold=0.2, verbose_mode=True)
    assert_test(test_case, [metric])
