"""
tests/test_evaluaciones_backend.py
===================================
Unit + integration tests for:
  F2 — GET /plantillas/{id}/estructura     → plantillas.py endpoint
  F3 — GET /evaluaciones/progress/{id}     → evaluaciones.py endpoint
  F4 — EvaluacionService.get_progreso()    → evaluacion_service.py

Imports validated against the real project structure:
  main.py                     → from main import app
  src/infrastructure/database → get_db
  src/interfaces/api/plantillas   → PlantillaRepository (via patch target)
  src/interfaces/api/evaluaciones → EvaluacionService (via patch target)
  src/application/services/evaluacion_service → EvaluacionService (unit tests)
  src/infrastructure/repositories/evaluacion_repository → EvaluacionRepository

Run:
  pytest tests/test_evaluaciones_backend.py -v
  pytest tests/test_evaluaciones_backend.py -v --cov=src --cov-report=term-missing

Pattern: Arrange / Act / Assert
"""

from __future__ import annotations

import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app
from src.infrastructure.database import get_db
from src.application.services.evaluacion_service import EvaluacionService
from src.infrastructure.repositories.plantilla_repository import PlantillaRepository
from src.infrastructure.repositories.evaluacion_repository import EvaluacionRepository


# ══════════════════════════════════════════════════════════════════════════════
# TEST-DATA FACTORIES
# ══════════════════════════════════════════════════════════════════════════════

def _make_opcion(id: int = 1) -> MagicMock:
    """
    Opcion ORM mock — fields match OpcionResponse schema exactly:
      id: int, codigo: str, etiqueta: str, valor: int
    Note: 'es_na' is NOT in the schema; only needed by calcular_resultados.
    """
    o = MagicMock(spec=[])
    o.id      = id
    o.codigo  = f"OPC-{id:03d}"
    o.etiqueta = f"Opción {id}"
    o.valor   = id          # int, as declared in OpcionResponse
    o.es_na   = False       # ORM-only field, not serialized
    return o



def _make_pregunta(id: int, texto: str = "Pregunta test") -> MagicMock:
    """
    Pregunta ORM mock — fields match PreguntaResponse schema exactly:
      id: int, texto: str, texto_en: Optional[str], orden: int,
      tipo_respuesta: str, opciones: List[OpcionResponse]
    """
    p = MagicMock(spec=[])
    p.id             = id
    p.texto          = texto
    p.texto_en       = "Test question EN"   # Optional[str]
    p.orden          = id                   # int  ← required, was missing
    p.tipo_respuesta = "numerica"           # str  ← required
    p.dimension_id   = (id // 10) or 1     # ORM-only, not serialized
    p.opciones       = []
    return p


def _make_dimension(id: int, preguntas: list | None = None) -> MagicMock:
    """
    Dimension ORM mock — fields match DimensionResponse schema exactly:
      id: int, nombre: str, orden: int, preguntas: List[PreguntaResponse]
    """
    d = MagicMock(spec=[])
    d.id        = id
    d.nombre    = f"Dimensión {id}"
    d.orden     = id        # int  ← required, was missing
    d.preguntas = preguntas if preguntas is not None else [
        _make_pregunta(id * 10 + 1),
        _make_pregunta(id * 10 + 2),
    ]
    return d


def _make_plantilla(id: int = 1, dimensiones: list | None = None) -> MagicMock:
    """
    Plantilla ORM mock — fields match PlantillaEstructura schema exactly:
      PlantillaEstructura → PlantillaResponse → PlantillaBase

      PlantillaBase    : codigo: str, nombre: str, descripcion: Optional[str]
      PlantillaResponse: id: int, version: int, activa: bool
      PlantillaEstructura: dimensiones: List[DimensionResponse]
    """
    pl = MagicMock(spec=[])
    pl.id          = id
    pl.codigo      = "PLT-001"          # str   ← required (PlantillaBase)
    pl.nombre      = "Plantilla Test"   # str   ← required (PlantillaBase)
    pl.descripcion = "Descripción test" # Optional[str]
    pl.version     = 1                  # int   ← required, was missing
    pl.activa      = True               # bool  ← required
    pl.dimensiones = dimensiones if dimensiones is not None else [
        _make_dimension(1),
        _make_dimension(2),
    ]
    return pl


def _make_respuesta_orm(
    pregunta_id: int,
    valor_numerico: float | None = None,
    opcion_id: int | None = None,
    comentario: str = "",
) -> MagicMock:
    r = MagicMock(spec=[])
    r.pregunta_id    = pregunta_id
    r.valor_numerico = valor_numerico
    r.opcion_id      = opcion_id
    r.comentario     = comentario
    # Needed by calcular_resultados (not under test here, but avoids attr errors)
    r.pregunta       = MagicMock(spec=[])
    r.pregunta.dimension_id = pregunta_id
    r.opcion         = _make_opcion()
    return r


def _make_evaluacion(id: int = 1, respuestas: list | None = None) -> MagicMock:
    """Minimal Evaluacion ORM mock matching EvaluacionRepository.get_by_id output."""
    ev = MagicMock(spec=[])
    ev.id                  = id
    ev.plantilla_id        = 1
    ev.proyecto_id         = 10
    ev.evaluador_id        = 5
    ev.estado              = "borrador"
    ev.progress_percentage = 50.0
    ev.answered_count      = 2
    ev.total_questions     = 4
    ev.created_at          = datetime(2024, 1, 15, 12, 0, 0)
    ev.respuestas = respuestas if respuestas is not None else [
        _make_respuesta_orm(1, valor_numerico=4.0),
        _make_respuesta_orm(2, comentario="sin respuesta"),
    ]
    return ev


# ══════════════════════════════════════════════════════════════════════════════
# FIXTURES
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def mock_db() -> MagicMock:
    """
    Isolated SQLAlchemy Session mock.
    Plain MagicMock (no spec) so all Session methods are accessible
    without explicit enumeration (query, add, commit, flush, etc.).
    """
    return MagicMock()


@pytest.fixture
def client(mock_db: MagicMock):
    """
    TestClient with get_db overridden.
    Uses the same conftest.py pattern already present in the project.
    """
    def _override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ══════════════════════════════════════════════════════════════════════════════
# FLUJO 2 — GET /plantillas/{id}/estructura
# Route  : src/interfaces/api/plantillas.py → get_estructura()
# Repo   : src/infrastructure/repositories/plantilla_repository.py
#          → PlantillaRepository.get_by_id_with_structure()
# Decision F2-D1: if not plantilla → 404
# ══════════════════════════════════════════════════════════════════════════════

class TestGetEstructura:
    """
    Endpoint: GET /plantillas/{id}/estructura
    Patch target: src.infrastructure.repositories.plantilla_repository.PlantillaRepository
    """

    _PATCH = "src.infrastructure.repositories.plantilla_repository.PlantillaRepository.get_by_id_with_structure"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F2-01 | F2-P01 — Happy path: plantilla exists
    # Covers: F2-D1 = FALSE  (not plantilla → False → return plantilla)
    # Validates: HTTP 200, repo called with correct id
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_200_when_plantilla_exists(self, client: TestClient):
        """
        F2-P01 — Repo returns a Plantilla object.
        Endpoint must return HTTP 200 and call repo with the correct id.
        """
        # Arrange
        plantilla = _make_plantilla(id=1)
        with patch(self._PATCH, return_value=plantilla) as mock_repo:
            # Act
            response = client.get("/plantillas/1/estructura")

        # Assert
        assert response.status_code == 200
        mock_repo.assert_called_once_with(1)

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F2-02 | F2-P02 — Plantilla not found → 404
    # Covers: F2-D1 = TRUE  (not plantilla → True → HTTPException 404)
    # Validates: HTTP 404, detail message matches code
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_404_when_plantilla_not_found(self, client: TestClient):
        """
        F2-P02 — Repo returns None.
        Endpoint must raise HTTPException(404, 'Plantilla no encontrada').
        """
        # Arrange
        with patch(self._PATCH, return_value=None):
            # Act
            response = client.get("/plantillas/999/estructura")

        # Assert
        assert response.status_code == 404
        assert response.json()["detail"] == "Plantilla no encontrada"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F2-03 | F2-CL01 — Boundary: id = 0 or negative values
    # Covers: F2-D1 = TRUE (boundary)
    # Validates: repo returns None → 404 for semantically invalid IDs
    # ─────────────────────────────────────────────────────────────────────────
    @pytest.mark.parametrize("invalid_id", [0, -1, -99])
    def test_returns_404_for_zero_or_negative_ids(
        self, client: TestClient, invalid_id: int
    ):
        """
        F2-CL01 — IDs ≤ 0 are not valid PKs; repo returns None → 404.
        """
        # Arrange
        with patch(self._PATCH, return_value=None):
            # Act
            response = client.get(f"/plantillas/{invalid_id}/estructura")

        # Assert
        assert response.status_code == 404
        assert response.json()["detail"] == "Plantilla no encontrada"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F2-04 | F2-CL02 — Boundary: plantilla with dimensiones = []
    # Covers: F2-D1 = FALSE (boundary — truthy object with empty list)
    # Validates: HTTP 200 — empty structure is valid, not a 404
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_200_for_plantilla_with_empty_dimensiones(
        self, client: TestClient
    ):
        """
        F2-CL02 — Plantilla exists but has no dimensiones.
        Must return HTTP 200 (not 404) — emptiness is not absence.
        """
        # Arrange
        plantilla = _make_plantilla(id=1, dimensiones=[])
        with patch(self._PATCH, return_value=plantilla):
            # Act
            response = client.get("/plantillas/1/estructura")

        # Assert — still 200, empty dimensiones is a valid state
        assert response.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# FLUJO 3 — GET /evaluaciones/progress/{evaluation_id}
# Route  : src/interfaces/api/evaluaciones.py → get_progress()
# Service: src/application/services/evaluacion_service.py → get_progreso()
# Decision F3-D1: if not progress → 404
# ══════════════════════════════════════════════════════════════════════════════

class TestGetProgress:
    """
    Endpoint: GET /evaluaciones/progress/{evaluation_id}
    Patch target: src.application.services.evaluacion_service.EvaluacionService.get_progreso
    """

    _PATCH = "src.application.services.evaluacion_service.EvaluacionService.get_progreso"

    def _progress_payload(self, evaluation_id: int = 99, respuestas: list | None = None) -> dict:
        """Builds a valid progress dict matching ProgressResponse schema."""
        return {
            "evaluation_id":       evaluation_id,
            "plantilla_id":        1,
            "proyecto_id":         10,
            "evaluador_id":        5,
            "estado":              "borrador",
            "progress_percentage": 50.0,
            "answered_count":      2,
            "total_questions":     4,
            "respuestas":          respuestas if respuestas is not None else [
                {"pregunta_id": 1, "valor_numerico": 4.0, "opcion_id": None, "comentario": ""},
            ],
            "updated_at":          "2024-01-15T12:00:00",
        }

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F3-01 | F3-P01 — Happy path: progress found
    # Covers: F3-D1 = FALSE  (not progress → False → return progress)
    # Validates: HTTP 200, body fields, service called with correct id
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_200_when_progress_exists(self, client: TestClient):
        """
        F3-P01 — Service returns a progress dict.
        Endpoint must return HTTP 200 with that payload.
        """
        # Arrange
        payload = self._progress_payload(evaluation_id=99)
        with patch(self._PATCH, return_value=payload) as mock_svc:
            # Act
            response = client.get("/evaluaciones/progress/99")

        # Assert — HTTP 200
        assert response.status_code == 200
        # Service called with correct evaluation_id
        mock_svc.assert_called_once_with(99)
        # Key fields present in body
        body = response.json()
        assert body["evaluation_id"] == 99
        assert len(body["respuestas"]) == 1

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F3-02 | F3-P02 — Progress not found → 404
    # Covers: F3-D1 = TRUE  (not progress → True → HTTPException 404)
    # Validates: HTTP 404, detail message matches code exactly
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_404_when_progress_not_found(self, client: TestClient):
        """
        F3-P02 — Service returns None.
        Endpoint must raise HTTPException(404, 'Evaluation progress not found').
        """
        # Arrange
        with patch(self._PATCH, return_value=None):
            # Act
            response = client.get("/evaluaciones/progress/999")

        # Assert
        assert response.status_code == 404
        assert response.json()["detail"] == "Evaluation progress not found"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F3-03 | F3-CL01 — Boundary: progress with respuestas = []
    # Covers: F3-D1 = FALSE (boundary — non-None dict is truthy even if empty)
    # Validates: HTTP 200, respuestas field is empty list (not error)
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_200_with_empty_respuestas(self, client: TestClient):
        """
        F3-CL01 — Draft exists but has no saved answers (respuestas=[]).
        Must return HTTP 200 — empty respuestas is a valid state.
        """
        # Arrange
        payload = self._progress_payload(evaluation_id=77, respuestas=[])
        payload["answered_count"] = 0
        with patch(self._PATCH, return_value=payload):
            # Act
            response = client.get("/evaluaciones/progress/77")

        # Assert
        assert response.status_code == 200
        assert response.json()["respuestas"] == []

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F3-04 | F3-EN01 — Negative: invalid / non-existent evaluation_id
    # Covers: F3-D1 = TRUE (boundary)
    # Validates: HTTP 404 for IDs that produce None from service
    # ─────────────────────────────────────────────────────────────────────────
    @pytest.mark.parametrize("invalid_id", [0, -1, -999])
    def test_returns_404_for_invalid_evaluation_id(
        self, client: TestClient, invalid_id: int
    ):
        """
        F3-EN01 — IDs not found in the system produce None from service → 404.
        """
        # Arrange
        with patch(self._PATCH, return_value=None):
            # Act
            response = client.get(f"/evaluaciones/progress/{invalid_id}")

        # Assert
        assert response.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# FLUJO 4 — EvaluacionService.get_progreso()  — pure unit tests
# Service: src/application/services/evaluacion_service.py
# Repo   : src/infrastructure/repositories/evaluacion_repository.py
# Decision F4-D1: if not evaluacion → return None
# ══════════════════════════════════════════════════════════════════════════════

class TestGetProgreso:
    """
    Unit tests for EvaluacionService.get_progreso().
    The DB session is mocked; EvaluacionRepository.get_by_id is patched
    so no real query is executed.

    Patch target:
      src.infrastructure.repositories.evaluacion_repository.EvaluacionRepository.get_by_id
    """

    _PATCH = "src.infrastructure.repositories.evaluacion_repository.EvaluacionRepository.get_by_id"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F4-01 | F4-P01 — Happy path: evaluacion found → full dict returned
    # Covers: F4-D1 = FALSE
    # Validates: all required keys, correct value mapping from ORM object
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_full_dict_when_evaluacion_exists(self, mock_db: MagicMock):
        """
        F4-P01 — Repository returns an Evaluacion ORM object.
        get_progreso must return a dict with all expected keys
        and correctly mapped values.
        """
        # Arrange
        evaluacion = _make_evaluacion(id=99)
        service    = EvaluacionService(mock_db)

        with patch(self._PATCH, return_value=evaluacion) as mock_repo:
            # Act
            result = service.get_progreso(99)

        # Assert — repo called with correct id
        mock_repo.assert_called_once_with(99)

        # Assert — not None (F4-D1 = FALSE)
        assert result is not None

        # Assert — all required keys present
        required_keys = {
            "evaluation_id", "plantilla_id", "proyecto_id", "evaluador_id",
            "estado", "progress_percentage", "answered_count",
            "total_questions", "respuestas", "updated_at",
        }
        assert required_keys.issubset(result.keys())

        # Assert — values correctly mapped from ORM fields
        assert result["evaluation_id"]       == 99
        assert result["plantilla_id"]        == evaluacion.plantilla_id
        assert result["proyecto_id"]         == evaluacion.proyecto_id
        assert result["evaluador_id"]        == evaluacion.evaluador_id
        assert result["estado"]              == evaluacion.estado
        assert result["progress_percentage"] == evaluacion.progress_percentage
        assert result["answered_count"]      == evaluacion.answered_count
        assert result["total_questions"]     == evaluacion.total_questions
        # updated_at is mapped from created_at in the service
        assert result["updated_at"]          == evaluacion.created_at

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F4-02 | F4-P02 — Evaluacion not found → returns None
    # Covers: F4-D1 = TRUE
    # Validates: None returned, no exception raised (endpoint handles 404)
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_none_when_evaluacion_not_found(self, mock_db: MagicMock):
        """
        F4-P02 — Repository returns None.
        get_progreso must return None without raising any exception.
        The 404 responsibility belongs to the get_progress endpoint (F3).
        """
        # Arrange
        service = EvaluacionService(mock_db)

        with patch(self._PATCH, return_value=None) as mock_repo:
            # Act
            result = service.get_progreso(999)

        # Assert — repo called
        mock_repo.assert_called_once_with(999)

        # Assert — None returned, no exception (F4-D1 = TRUE)
        assert result is None

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F4-03 | F4-CL01 — Boundary: evaluacion exists with respuestas = []
    # Covers: F4-D1 = FALSE (boundary — list comprehension over empty iterable)
    # Validates: dict returned with respuestas=[], no IndexError / StopIteration
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_empty_respuestas_when_no_answers_saved(self, mock_db: MagicMock):
        """
        F4-CL01 — Evaluacion exists but evaluacion.respuestas = [].
        List comprehension must handle empty iterable gracefully.
        Must return a valid dict with respuestas=[], NOT None.
        """
        # Arrange
        evaluacion               = _make_evaluacion(id=77, respuestas=[])
        evaluacion.answered_count = 0
        service = EvaluacionService(mock_db)

        with patch(self._PATCH, return_value=evaluacion):
            # Act
            result = service.get_progreso(77)

        # Assert — dict returned (not None)
        assert result is not None
        assert result["respuestas"] == []
        assert result["answered_count"] == 0

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F4-04 | F4-CL03 — Boundary: soft-deleted evaluation
    # Covers: F4-D1 = TRUE (boundary — repo filters deleted rows → None)
    # Validates: None returned without exception
    # ─────────────────────────────────────────────────────────────────────────
    def test_returns_none_for_soft_deleted_evaluacion(self, mock_db: MagicMock):
        """
        F4-CL03 — EvaluacionRepository.get_by_id() filters soft-deleted
        records and returns None for a previously valid id.
        get_progreso must return None — it must NOT bypass the repo.
        """
        # Arrange
        service = EvaluacionService(mock_db)

        with patch(self._PATCH, return_value=None):
            # Act
            result = service.get_progreso(42)

        # Assert
        assert result is None

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F4-05 | F4-P01 detail — Respuestas list comprehension field mapping
    # Covers: F4-D1 = FALSE — each respuesta field mapped 1-to-1 from ORM
    # Validates: pregunta_id, valor_numerico, opcion_id, comentario per item
    # ─────────────────────────────────────────────────────────────────────────
    def test_maps_all_respuesta_fields_correctly(self, mock_db: MagicMock):
        """
        F4-P01 (detail) — List comprehension in get_progreso must map
        pregunta_id, valor_numerico, opcion_id, comentario for every respuesta.
        Includes boundary valor_numerico=0 (falsy but valid).
        """
        # Arrange — 3 varied respuestas to cover all field combinations
        respuestas_orm = [
            _make_respuesta_orm(1, valor_numerico=5.0, opcion_id=None,  comentario="ok"),
            _make_respuesta_orm(2, valor_numerico=None, opcion_id=3,    comentario=""),
            _make_respuesta_orm(3, valor_numerico=0.0, opcion_id=None,  comentario="cero válido"),
        ]
        evaluacion = _make_evaluacion(id=1, respuestas=respuestas_orm)
        service    = EvaluacionService(mock_db)

        with patch(self._PATCH, return_value=evaluacion):
            # Act
            result = service.get_progreso(1)

        # Assert — exactly 3 respuestas
        assert len(result["respuestas"]) == 3

        # Respuesta 0: valor_numerico=5.0
        r0 = result["respuestas"][0]
        assert r0["pregunta_id"]    == 1
        assert r0["valor_numerico"] == 5.0
        assert r0["opcion_id"]      is None
        assert r0["comentario"]     == "ok"

        # Respuesta 1: opcion_id=3, valor_numerico=None
        r1 = result["respuestas"][1]
        assert r1["pregunta_id"]    == 2
        assert r1["valor_numerico"] is None
        assert r1["opcion_id"]      == 3
        assert r1["comentario"]     == ""

        # Respuesta 2: valor_numerico=0.0 — falsy but MUST be preserved
        r2 = result["respuestas"][2]
        assert r2["pregunta_id"]    == 3
        assert r2["valor_numerico"] == 0.0
        assert r2["comentario"]     == "cero válido"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-F4-06 | F4-EN02 — Negative: repository raises DB exception
    # Covers: defensive — DB failures must propagate, not be swallowed
    # Validates: exception propagates so HTTP layer returns 500
    # ─────────────────────────────────────────────────────────────────────────
    def test_propagates_db_exception_without_swallowing(self, mock_db: MagicMock):
        """
        F4-EN02 — If get_by_id raises a DB exception (network drop, etc.),
        get_progreso must NOT catch it silently.
        The exception must propagate so the HTTP layer returns 500.
        """
        # Arrange
        service = EvaluacionService(mock_db)

        with patch(self._PATCH, side_effect=Exception("DB connection lost")):
            # Act + Assert — exception propagates unchanged
            with pytest.raises(Exception, match="DB connection lost"):
                service.get_progreso(1)


# ══════════════════════════════════════════════════════════════════════════════
# INTEGRATION — F3 ↔ F4 chain (no service mock — tests the real call chain)
# Validates the contract: F4 None → F3 must produce 404
#                         F4 dict → F3 must produce 200
# Only EvaluacionRepository.get_by_id is patched (outermost real boundary).
# ══════════════════════════════════════════════════════════════════════════════

class TestGetProgressIntegration:
    """
    Integration tests for the F3 → F4 chain.

    EvaluacionService is NOT mocked here; the real service method runs.
    Only EvaluacionRepository.get_by_id is patched so no DB is needed.

    QA note: 'F3 y F4 forman una cadena crítica. Si F4 retorna None,
    F3 debe lanzar la HTTPException. Validar con test de integración.'
    """

    _PATCH = "src.infrastructure.repositories.evaluacion_repository.EvaluacionRepository.get_by_id"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-INT-01 — F4 returns None (no evaluacion) → F3 must return 404
    # ─────────────────────────────────────────────────────────────────────────
    def test_chain_repo_none_produces_404(self, client: TestClient):
        """
        Integration F3→F4: repo returns None → service returns None
        → endpoint raises HTTPException(404).
        """
        # Arrange — no evaluacion in repo
        with patch(self._PATCH, return_value=None):
            # Act
            response = client.get("/evaluaciones/progress/999")

        # Assert
        assert response.status_code == 404
        assert response.json()["detail"] == "Evaluation progress not found"

    # ─────────────────────────────────────────────────────────────────────────
    # TC-INT-02 — F4 returns evaluacion → F3 must return 200
    # ─────────────────────────────────────────────────────────────────────────
    def test_chain_repo_evaluacion_produces_200(self, client: TestClient):
        """
        Integration F3→F4: repo returns Evaluacion → service builds dict
        → endpoint returns HTTP 200 with correct evaluation_id.
        """
        # Arrange — evaluacion exists in repo
        evaluacion = _make_evaluacion(id=99)
        with patch(self._PATCH, return_value=evaluacion):
            # Act
            response = client.get("/evaluaciones/progress/99")

        # Assert
        assert response.status_code == 200
        assert response.json()["evaluation_id"] == 99

    # ─────────────────────────────────────────────────────────────────────────
    # TC-INT-03 — F4 returns evaluacion with empty respuestas → F3 returns 200
    # ─────────────────────────────────────────────────────────────────────────
    def test_chain_empty_respuestas_still_produces_200(self, client: TestClient):
        """
        Integration F3→F4 boundary: evaluacion exists with respuestas=[].
        Service returns valid dict → endpoint must still return 200.
        """
        # Arrange
        evaluacion = _make_evaluacion(id=77, respuestas=[])
        with patch(self._PATCH, return_value=evaluacion):
            # Act
            response = client.get("/evaluaciones/progress/77")

        # Assert
        assert response.status_code == 200
        assert response.json()["respuestas"] == []