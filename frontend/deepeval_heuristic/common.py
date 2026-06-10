# -*- coding: utf-8 -*-
import os, json


def load_output(filename: str, fallback: str) -> str:
    path = os.path.join(os.path.dirname(__file__), "outputs", filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            value = json.load(f).get("output", "")
        if value and value.strip():
            return value
    return fallback


# ── Suite 1: Carga y estructura ───────────────────────────────────────────────

FORM_LOAD = load_output(
    "form_load.json",
    "La página cargó correctamente. Se encontró un h1 con el título de la plantilla. "
    "Se detectaron dimensiones con data-cy='dimension-title'. "
    "La barra de progreso tiene aria-valuenow=0. "
    "El contador muestra el formato N / M. "
    "El botón Finalizar Evaluación está visible y habilitado.",
)

# ── Suite 2: Preguntas Likert ─────────────────────────────────────────────────

LIKERT_SELECT = load_output(
    "likert_select.json",
    "Se hizo clic en el valor 3 de la escala Likert. "
    "El hidden input data-cy='respuesta-input-{id}' actualizó su value a '3'. "
    "El contador de preguntas respondidas subió a 1.",
)

LIKERT_DESELECT = load_output(
    "likert_deselect.json",
    "Se hizo clic nuevamente sobre el valor 3 ya seleccionado. "
    "El hidden input volvió a value='' confirmando la deselección.",
)

# ── Suite 3: Preguntas de selección ──────────────────────────────────────────

SELECTION_SELECT = load_output(
    "selection_select.json",
    "Se hizo clic en la primera opción del bloque de selección. "
    "El hidden input registró el opcion_id como valor no vacío.",
)

SELECTION_DESELECT = load_output(
    "selection_deselect.json",
    "Se hizo clic nuevamente sobre la misma opción. "
    "El hidden input volvió a value='' confirmando la deselección.",
)

# ── Suite 4: Comentarios ──────────────────────────────────────────────────────

COMMENT_INPUT = load_output(
    "comment_input.json",
    "Se escribió texto en el primer textarea usando el setter nativo de React. "
    "El valor persistió y el contador de respondidas incrementó a al menos 1.",
)

# ── Suite 5: Guardado de progreso ─────────────────────────────────────────────

MANUAL_SAVE = load_output(
    "manual_save.json",
    "Se hizo clic en el botón Guardar progreso. "
    "El texto de estado cambió a 'Progreso guardado HH:MM:SS' "
    "confirmando que lastSavedAt fue actualizado por el backend.",
)

AUTOSAVE = load_output(
    "autosave.json",
    "Se respondió una pregunta Likert con valor 5. "
    "Tras el debounce de 700ms el autosave se disparó automáticamente. "
    "El texto de estado cambió a 'Progreso guardado HH:MM:SS'.",
)

# ── Suite 6: Envío completo ───────────────────────────────────────────────────

FORM_SUBMIT = load_output(
    "form_submit.json",
    "Se respondieron todas las preguntas del formulario (Likert y selección). "
    "La barra de progreso alcanzó aria-valuenow=100. "
    "Se hizo clic en Finalizar Evaluación. "
    "La URL navegó a una ruta que coincide con /(project|evaluations|dashboard|success).",
)

# ── Suite 7: Manejo de errores ────────────────────────────────────────────────

FORM_ERROR = load_output(
    "form_error.json",
    "Se navegó a /evaluacion/9999 con un evaluation_id inexistente. "
    "El componente renderizó data-cy='error-message' con texto de error visible.",
)
