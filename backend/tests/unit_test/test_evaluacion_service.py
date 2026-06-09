from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from src.application.services.evaluacion_service import EvaluacionService
from src.domain.schemas import EvaluacionCreate, ProgressSave, RespuestaCreate


def _service(db: MagicMock | None = None) -> EvaluacionService:
    service = EvaluacionService(db or MagicMock())
    service.repository = MagicMock()
    return service


def _eval_data() -> EvaluacionCreate:
    return EvaluacionCreate(
        plantilla_id=1,
        proyecto_id=10,
        evaluador_id=5,
        perfil="UX",
        estudios="Maestria",
        respuestas=[
            RespuestaCreate(pregunta_id=1, valor_numerico=Decimal("4")),
            RespuestaCreate(pregunta_id=2, opcion_id=3, comentario="ok"),
        ],
    )


def _progress_data() -> ProgressSave:
    return ProgressSave(
        evaluation_id=77,
        plantilla_id=1,
        proyecto_id=10,
        evaluador_id=5,
        respuestas=[RespuestaCreate(pregunta_id=1, valor_numerico=Decimal("3"))],
        status="incomplete",
    )


def _respuesta(
    dimension_id: int,
    valor_numerico: Decimal | None = None,
    opcion_id: int | None = None,
    opcion_valor: int | None = None,
    es_na: bool = False,
) -> MagicMock:
    respuesta = MagicMock()
    respuesta.valor_numerico = valor_numerico
    respuesta.opcion_id = opcion_id
    respuesta.pregunta = MagicMock()
    respuesta.pregunta.dimension_id = dimension_id
    respuesta.opcion = MagicMock()
    respuesta.opcion.valor = opcion_valor
    respuesta.opcion.es_na = es_na
    return respuesta


def _evaluacion(evaluation_id: int = 99, respuestas: list[MagicMock] | None = None) -> MagicMock:
    evaluacion = MagicMock()
    evaluacion.id = evaluation_id
    evaluacion.plantilla_id = 1
    evaluacion.proyecto_id = 10
    evaluacion.evaluador_id = 5
    evaluacion.estado = "borrador"
    evaluacion.progress_percentage = 50
    evaluacion.answered_count = 2
    evaluacion.total_questions = 4
    evaluacion.created_at = datetime(2026, 6, 8, 12, 0, 0)
    evaluacion.respuestas = respuestas if respuestas is not None else []
    return evaluacion


def _progress_respuesta(
    pregunta_id: int,
    valor_numerico: Decimal | None = None,
    opcion_id: int | None = None,
    comentario: str | None = None,
) -> MagicMock:
    respuesta = MagicMock()
    respuesta.pregunta_id = pregunta_id
    respuesta.valor_numerico = valor_numerico
    respuesta.opcion_id = opcion_id
    respuesta.comentario = comentario
    return respuesta


def _mock_resultados_query(db: MagicMock, respuestas: list[MagicMock]) -> None:
    query = MagicMock()
    db.query.return_value = query
    query.join.return_value = query
    query.filter.return_value = query
    query.all.return_value = respuestas


class TestRegistrarEvaluacion:
    def test_registra_evaluacion_valida_y_calcula_resultados(self):
        service = _service()
        db_eval = MagicMock(id=123)
        eval_data = _eval_data()
        service.repository.create_evaluacion.return_value = db_eval

        with patch.object(service, "calcular_resultados") as mock_calcular:
            result = service.registrar_evaluacion(eval_data)

        assert result is db_eval
        service.repository.create_evaluacion.assert_called_once_with(eval_data)
        mock_calcular.assert_called_once_with(123)

    def test_propaga_excepcion_del_repositorio_y_no_calcula_resultados(self):
        service = _service()
        service.repository.create_evaluacion.side_effect = RuntimeError("repo error")

        with patch.object(service, "calcular_resultados") as mock_calcular:
            with pytest.raises(RuntimeError, match="repo error"):
                service.registrar_evaluacion(_eval_data())

        mock_calcular.assert_not_called()


class TestGetEvaluacionesProyecto:
    def test_retorna_evaluaciones_con_resultados(self):
        service = _service()
        evaluacion = MagicMock(id=1)
        evaluacion.resultados_dimension = [MagicMock(dimension_id=10)]
        service.repository.get_by_project.return_value = [evaluacion]

        result = service.get_evaluaciones_proyecto(10)

        assert result == [evaluacion]
        assert result[0].resultados_dimension
        service.repository.get_by_project.assert_called_once_with(10)

    def test_retorna_lista_vacia_sin_resultados(self):
        service = _service()
        service.repository.get_by_project.return_value = []

        result = service.get_evaluaciones_proyecto(10)

        assert result == []
        service.repository.get_by_project.assert_called_once_with(10)


class TestGuardarProgreso:
    def test_guarda_progreso_exitosamente(self):
        service = _service()
        progress_data = _progress_data()
        draft = MagicMock(id=77)
        service.repository.save_draft.return_value = draft

        result = service.guardar_progreso(progress_data)

        assert result is draft
        service.repository.save_draft.assert_called_once_with(progress_data)

    def test_propaga_excepcion_de_guardado(self):
        service = _service()
        service.repository.save_draft.side_effect = RuntimeError("save error")

        with pytest.raises(RuntimeError, match="save error"):
            service.guardar_progreso(_progress_data())


class TestGetProgreso:
    def test_retorna_none_cuando_evaluacion_no_existe(self):
        service = _service()
        service.repository.get_by_id.return_value = None

        result = service.get_progreso(999)

        assert result is None
        service.repository.get_by_id.assert_called_once_with(999)

    def test_retorna_evaluacion_encontrada_con_respuestas_vacias(self):
        service = _service()
        evaluacion = _evaluacion(77, respuestas=[])
        service.repository.get_by_id.return_value = evaluacion

        result = service.get_progreso(77)

        assert result == {
            "evaluation_id": 77,
            "plantilla_id": 1,
            "proyecto_id": 10,
            "evaluador_id": 5,
            "estado": "borrador",
            "progress_percentage": 50,
            "answered_count": 2,
            "total_questions": 4,
            "respuestas": [],
            "updated_at": evaluacion.created_at,
        }

    def test_retorna_evaluacion_encontrada_con_respuestas_cargadas(self):
        service = _service()
        respuestas = [
            _progress_respuesta(1, valor_numerico=Decimal("5"), comentario="num"),
            _progress_respuesta(2, opcion_id=8, comentario="cat"),
        ]
        evaluacion = _evaluacion(88, respuestas=respuestas)
        service.repository.get_by_id.return_value = evaluacion

        result = service.get_progreso(88)

        assert result["evaluation_id"] == 88
        assert result["respuestas"] == [
            {
                "pregunta_id": 1,
                "valor_numerico": Decimal("5"),
                "opcion_id": None,
                "comentario": "num",
            },
            {
                "pregunta_id": 2,
                "valor_numerico": None,
                "opcion_id": 8,
                "comentario": "cat",
            },
        ]


class TestCalcularResultados:
    def test_calcula_promedios_warnings_y_multiples_dimensiones(self):
        db = MagicMock()
        respuestas = [
            _respuesta(1, valor_numerico=Decimal("4")),
            _respuesta(1, opcion_id=10, opcion_valor=1, es_na=False),
            _respuesta(1, opcion_id=11, opcion_valor=5, es_na=False),
            _respuesta(1, opcion_id=12, opcion_valor=1, es_na=True),
            _respuesta(2, valor_numerico=Decimal("2")),
            _respuesta(3, valor_numerico=None, opcion_id=None),
        ]
        _mock_resultados_query(db, respuestas)
        service = _service(db)

        service.calcular_resultados(123)

        assert db.add.call_count == 2
        resultados = db.add.call_args_list
        dim_1 = resultados[0].args[0]
        dim_2 = resultados[1].args[0]

        assert dim_1.evaluacion_id == 123
        assert dim_1.dimension_id == 1
        assert dim_1.promedio == Decimal("2.75")
        assert dim_1.total_preguntas == 4
        assert dim_1.respondidas == 4
        assert dim_1.warnings == 1

        assert dim_2.dimension_id == 2
        assert dim_2.promedio == Decimal("2")
        assert dim_2.total_preguntas == 1
        assert dim_2.respondidas == 1
        assert dim_2.warnings == 0

        db.commit.assert_called_once()

    def test_no_agrega_resultados_si_respuestas_no_tienen_valor(self):
        db = MagicMock()
        _mock_resultados_query(db, [_respuesta(9, valor_numerico=None, opcion_id=None)])
        service = _service(db)

        service.calcular_resultados(321)

        db.add.assert_not_called()
        db.commit.assert_called_once()
