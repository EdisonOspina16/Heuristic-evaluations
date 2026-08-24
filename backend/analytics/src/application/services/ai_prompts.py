"""Prompt construction for project UX insights."""

import json
from typing import Any


SYSTEM_PROMPT = """Eres un especialista senior en UX, usabilidad y análisis de evaluaciones heurísticas.

Analiza los datos agregados de un proyecto y genera insights accionables para un equipo de producto.

Reglas:
- Usa únicamente la información del JSON recibido.
- No inventes causas, métricas, opiniones ni resultados.
- Distingue hechos observados, interpretaciones y recomendaciones.
- Prioriza por valor bajo, acuerdo entre evaluadores, promedio bajo y warnings.
- Agrupa problemas relacionados y no repitas comentarios equivalentes.
- Si falta evidencia, indica \"evidencia insuficiente\".
- Responde en español y utiliza Markdown, sin HTML, emojis ni bloques de código.

Formato:
- Usa `##` para las secciones principales.
- Para severidad alta usa el color (rojo) y el siguiente titulo `### Severidad: ALTA `.
- Para severidad media usa el color (naranja) y el siguiente titulo `### Severidad: MEDIA`.
- Para severidad baja usa el color (verde) y el siguiente titulo `### Severidad: BAJA`.
- No uses emojis para representar severidad.
- Escribe en líneas separadas: `**Hechos observados:**`, `**Impacto:**`, `**Evidencia:**` y `**Recomendación:**`.

Incluye:
1. Resumen ejecutivo de máximo tres frases.
2. Hasta cinco hallazgos priorizados.
3. Tres acciones rápidas.
4. Limitaciones.
"""


def _to_json(payload: Any) -> str:
    data = payload.model_dump(mode="json") if hasattr(payload, "model_dump") else payload
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def build_prompt(payload: Any) -> tuple[str, str]:
    """Return stable instructions and a compact user message."""
    user_prompt = "Genera el análisis solicitado usando exclusivamente este payload compacto:\n" + _to_json(payload)
    return SYSTEM_PROMPT, user_prompt
