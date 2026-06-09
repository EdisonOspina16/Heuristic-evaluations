from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from src.domain.schemas import EvaluacionCreate, ProgressSave, RespuestaCreate
from src.infrastructure.models import (
    Dimension,
    Evaluacion,
    EvaluationProgress,
    Pregunta,
    Respuesta,
    ResultadoDimension,
)
from src.infrastructure.repositories.evaluacion_repository import EvaluacionRepository


class QueryDouble:
    def __init__(self, first_value=None, all_value=None, count_value=0):
        self.first_value = first_value
        self.all_value = all_value if all_value is not None else []
        self.count_value = count_value
        self.deleted = False
        self.join_calls = []
        self.filter_calls = []
        self.order_by_calls = []

    def join(self, *args):
        self.join_calls.append(args)
        return self

    def filter(self, *args):
        self.filter_calls.append(args)
        return self

    def order_by(self, *args):
        self.order_by_calls.append(args)
        return self

    def count(self):
        return self.count_value

    def first(self):
        return self.first_value

    def all(self):
        return self.all_value

    def delete(self):
        self.deleted = True
        return 1


class SessionDouble:
    def __init__(self, queries=None):
        self.queries = {model: list(values) for model, values in (queries or {}).items()}
        self.added = []
        self.deleted = []
        self.commits = 0
        self.flushes = 0
        self.rollbacks = 0
        self.refreshed = []

    def query(self, model):
        values = self.queries.get(model)
        if values:
            return values.pop(0)
        raise AssertionError(f"Unexpected query model: {model}")

    def add(self, obj):
        if isinstance(obj, Evaluacion) and obj.id is None:
            obj.id = 100 + len([item for item in self.added if isinstance(item, Evaluacion)])
        self.added.append(obj)

    def delete(self, obj):
        self.deleted.append(obj)

    def flush(self):
        self.flushes += 1

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        self.refreshed.append(obj)

    def rollback(self):
        self.rollbacks += 1


def _eval_data(evaluation_id=None, respuestas=None):
    return EvaluacionCreate(
        evaluation_id=evaluation_id,
        plantilla_id=1,
        proyecto_id=10,
        evaluador_id=5,
        perfil="UX",
        estudios="Maestria",
        respuestas=respuestas if respuestas is not None else [],
    )


def _respuesta(pregunta_id, valor=None, opcion_id=None, comentario=None):
    return RespuestaCreate(
        pregunta_id=pregunta_id,
        valor_numerico=valor,
        opcion_id=opcion_id,
        comentario=comentario,
    )


def _progress(evaluation_id=None, respuestas=None, status="incomplete"):
    return ProgressSave(
        evaluation_id=evaluation_id,
        plantilla_id=1,
        proyecto_id=10,
        evaluador_id=5,
        respuestas=respuestas if respuestas is not None else [],
        status=status,
    )


def _existing_eval(eval_id=77):
    evaluation = Evaluacion(
        plantilla_id=1,
        proyecto_id=10,
        evaluador_id=5,
        estado="borrador",
    )
    evaluation.id = eval_id
    return evaluation


def _existing_respuesta(pregunta_id=1):
    respuesta = Respuesta(
        evaluacion_id=77,
        pregunta_id=pregunta_id,
        valor_numerico=Decimal("1"),
        opcion_id=None,
        comentario="antes",
    )
    respuesta.id = pregunta_id
    return respuesta


class TestCreateEvaluacion:
    def test_crea_evaluacion_nueva_incompleta_con_respuestas_vacias(self):
        question_query = QueryDouble(count_value=2)
        db = SessionDouble({Pregunta: [question_query]})
        repository = EvaluacionRepository(db)

        result = repository.create_evaluacion(_eval_data(respuestas=[]))

        assert result.estado == "incompleta"
        assert result.plantilla_id == 1
        assert len(db.added) == 1
        assert isinstance(db.added[0], Evaluacion)
        assert db.flushes == 1
        assert db.commits == 1
        assert db.refreshed == [result]
        assert question_query.join_calls == [(Dimension,)]

    def test_crea_evaluacion_nueva_completa_con_respuestas_con_contenido(self):
        question_query = QueryDouble(count_value=3)
        db = SessionDouble({Pregunta: [question_query]})
        repository = EvaluacionRepository(db)
        eval_data = _eval_data(
            respuestas=[
                _respuesta(1, valor=Decimal("4")),
                _respuesta(2, opcion_id=8),
                _respuesta(3, comentario="hallazgo"),
            ]
        )

        result = repository.create_evaluacion(eval_data)

        respuestas = [item for item in db.added if isinstance(item, Respuesta)]
        assert result.estado == "completada"
        assert len(respuestas) == 3
        assert respuestas[0].evaluacion_id == result.id
        assert respuestas[0].valor_numerico == Decimal("4")
        assert respuestas[1].opcion_id == 8
        assert respuestas[2].comentario == "hallazgo"
        assert db.commits == 1
        assert db.refreshed == [result]

    def test_actualiza_evaluacion_existente_y_elimina_respuestas_y_resultados_previos(self):
        existing = _existing_eval(55)
        eval_query = QueryDouble(first_value=existing)
        question_query = QueryDouble(count_value=2)
        respuesta_delete_query = QueryDouble()
        resultado_delete_query = QueryDouble()
        db = SessionDouble({
            Evaluacion: [eval_query],
            Pregunta: [question_query],
            Respuesta: [respuesta_delete_query],
            ResultadoDimension: [resultado_delete_query],
        })
        repository = EvaluacionRepository(db)
        eval_data = _eval_data(
            evaluation_id=55,
            respuestas=[
                _respuesta(1, valor=Decimal("5")),
                _respuesta(2, comentario="ok"),
            ],
        )

        result = repository.create_evaluacion(eval_data)

        assert result is existing
        assert result.estado == "completada"
        assert result.perfil == "UX"
        assert result.estudios == "Maestria"
        assert respuesta_delete_query.deleted is True
        assert resultado_delete_query.deleted is True
        assert db.flushes == 0
        assert len([item for item in db.added if isinstance(item, Respuesta)]) == 2
        assert db.commits == 1
        assert db.refreshed == [existing]

    def test_evaluacion_es_incompleta_cuando_total_questions_es_cero(self):
        question_query = QueryDouble(count_value=0)
        db = SessionDouble({Pregunta: [question_query]})
        repository = EvaluacionRepository(db)

        result = repository.create_evaluacion(
            _eval_data(respuestas=[_respuesta(1, valor=Decimal("5"))])
        )

        assert result.estado == "incompleta"
        assert db.commits == 1


class TestSaveDraft:
    def test_crea_borrador_nuevo_con_respuesta_nueva_y_progress_entry_inexistente(self):
        draft_lookup_query = QueryDouble(first_value=None)
        existing_respuestas_query = QueryDouble(all_value=[])
        progress_query = QueryDouble(first_value=None)
        db = SessionDouble({
            Evaluacion: [draft_lookup_query],
            Respuesta: [existing_respuestas_query],
            EvaluationProgress: [progress_query],
        })
        repository = EvaluacionRepository(db)
        progress = _progress(respuestas=[_respuesta(1, valor=Decimal("3"))], status="draft")

        result = repository.save_draft(progress)

        assert result.estado == "borrador"
        assert db.flushes == 1
        assert any(isinstance(item, Evaluacion) for item in db.added)
        assert any(isinstance(item, Respuesta) for item in db.added)
        progress_entries = [item for item in db.added if isinstance(item, EvaluationProgress)]
        assert len(progress_entries) == 1
        assert progress_entries[0].status == "draft"
        assert db.commits == 1
        assert db.refreshed == [result]

    def test_actualiza_borrador_existente_y_respuestas_existentes_o_nuevas(self):
        existing_eval = _existing_eval(77)
        existing_answer_with_content = _existing_respuesta(1)
        existing_answer_empty = _existing_respuesta(2)
        progress_entry = EvaluationProgress(evaluation_id=77, status="incomplete")
        eval_query = QueryDouble(first_value=existing_eval)
        respuestas_query = QueryDouble(all_value=[existing_answer_with_content, existing_answer_empty])
        progress_query = QueryDouble(first_value=progress_entry)
        db = SessionDouble({
            Evaluacion: [eval_query],
            Respuesta: [respuestas_query],
            EvaluationProgress: [progress_query],
        })
        repository = EvaluacionRepository(db)
        progress = _progress(
            evaluation_id=77,
            respuestas=[
                _respuesta(1, valor=Decimal("4"), opcion_id=9, comentario="nuevo"),
                _respuesta(2, comentario="   "),
                _respuesta(3, opcion_id=10),
                _respuesta(4),
            ],
            status=None,
        )

        result = repository.save_draft(progress)

        assert result is existing_eval
        assert existing_answer_with_content.valor_numerico == Decimal("4")
        assert existing_answer_with_content.opcion_id == 9
        assert existing_answer_with_content.comentario == "nuevo"
        assert db.deleted == [existing_answer_empty]
        added_respuestas = [item for item in db.added if isinstance(item, Respuesta)]
        assert len(added_respuestas) == 1
        assert added_respuestas[0].pregunta_id == 3
        assert progress_entry.status == "incomplete"
        assert not any(item.pregunta_id == 4 for item in added_respuestas)
        assert db.commits == 1
        assert db.refreshed == [existing_eval]

    def test_reintenta_una_vez_si_ocurre_error_unique(self):
        db = SessionDouble()
        repository = EvaluacionRepository(db)
        draft = _existing_eval(99)
        repository._save_draft_impl = MagicMock(
            side_effect=[RuntimeError("unique constraint"), draft]
        )
        progress = _progress()

        result = repository.save_draft(progress)

        assert result is draft
        assert db.rollbacks == 1
        assert repository._save_draft_impl.call_count == 2

    def test_propaga_error_no_unique(self):
        db = SessionDouble()
        repository = EvaluacionRepository(db)
        repository._save_draft_impl = MagicMock(side_effect=RuntimeError("db down"))

        with pytest.raises(RuntimeError, match="db down"):
            repository.save_draft(_progress())

        assert db.rollbacks == 1

    def test_propaga_error_unique_cuando_ya_es_retry(self):
        db = SessionDouble()
        repository = EvaluacionRepository(db)
        repository._save_draft_impl = MagicMock(side_effect=RuntimeError("unique constraint"))

        with pytest.raises(RuntimeError, match="unique constraint"):
            repository.save_draft(_progress(), _retry=True)

        assert db.rollbacks == 1


class TestHelpers:
    def test_save_resultado_dimension_agrega_y_hace_commit(self):
        db = SessionDouble()
        repository = EvaluacionRepository(db)
        resultado = ResultadoDimension(evaluacion_id=1, dimension_id=2)

        repository.save_resultado_dimension(resultado)

        assert db.added == [resultado]
        assert db.commits == 1

    def test_get_by_id_filtra_por_id_y_retorna_primero(self):
        expected = _existing_eval(88)
        query = QueryDouble(first_value=expected)
        db = SessionDouble({Evaluacion: [query]})
        repository = EvaluacionRepository(db)

        result = repository.get_by_id(88)

        assert result is expected
        assert len(query.filter_calls) == 1

    def test_get_by_project_filtra_ordena_y_retorna_lista(self):
        expected = [_existing_eval(1), _existing_eval(2)]
        query = QueryDouble(all_value=expected)
        db = SessionDouble({Evaluacion: [query]})
        repository = EvaluacionRepository(db)

        result = repository.get_by_project(10)

        assert result == expected
        assert len(query.filter_calls) == 1
        assert len(query.order_by_calls) == 1
