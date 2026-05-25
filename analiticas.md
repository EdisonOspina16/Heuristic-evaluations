# Plan futuro para analíticas por proyecto

## Objetivo

Desarrollar un módulo de analíticas para `project/[id]/analytics` que consolide todas las evaluaciones heurísticas realizadas en un proyecto y las convierta en métricas visuales útiles para tomar decisiones de UX, UI, accesibilidad, contenido y calidad general.

La idea recomendada es separar responsabilidades:

* **Backend Python/FastAPI**: cálculo, agregación, limpieza y estructuración de datos analíticos.
* **Frontend Next.js + Chart.js**: visualización interactiva, filtros y lectura rápida de resultados.

Sí conviene hacerlo como **módulo aparte**, porque las analíticas tienen reglas propias, consultas pesadas, KPIs, filtros, comparaciones y posibles exportaciones. No debería quedar mezclado dentro del CRUD de evaluaciones.

---

## Estado actual del proyecto

Actualmente el proyecto ya tiene una base importante:

* `evaluaciones`: contiene proyecto, plantilla, evaluador, estado y fecha.
* `respuestas`: contiene respuestas por pregunta, valor numérico, opción categórica y comentarios.
* `resultados_dimensiones`: guarda promedios por dimensión después de finalizar una evaluación.
* `plantillas`, `dimensiones`, `preguntas`: permiten saber a qué heurística o dimensión pertenece cada respuesta.
* `evaluator_project_assignments`: permite saber qué rol/enfoque tiene cada evaluador dentro del proyecto.

Lo que falta es una capa dedicada que convierta esos datos en un contrato estable para gráficos.

---

## Módulo recomendado en backend

Crear un módulo nuevo en backend, por ejemplo:

```text
backend/src/application/services/analytics_service.py
backend/src/infrastructure/repositories/analytics_repository.py
backend/src/interfaces/api/analytics.py
```

Y registrar el router en:

```text
backend/src/interfaces/routes.py
```

### Endpoints sugeridos

```http
GET /analytics/projects/{project_id}/summary
GET /analytics/projects/{project_id}/heuristics
GET /analytics/projects/{project_id}/evaluators
GET /analytics/projects/{project_id}/timeline
GET /analytics/projects/{project_id}/comments
```

### Endpoint principal recomendado

Para empezar, se puede crear un solo endpoint completo:

```http
GET /analytics/projects/{project_id}
```

Respuesta sugerida:

```json
{
  "project": {
    "id": 1,
    "name": "Ecoenergy"
  },
  "summary": {
    "total_evaluations": 12,
    "completed_evaluations": 8,
    "incomplete_evaluations": 4,
    "average_score": 3.7,
    "critical_warnings": 9,
    "completion_rate": 66
  },
  "heuristics": [
    {
      "dimension_id": 25,
      "name": "Consistencia y estándares",
      "average": 2.8,
      "answered": 42,
      "warnings": 5
    }
  ],
  "evaluation_types": [
    {
      "name": "Evaluación Heurística Nielsen + Tognazzini",
      "count": 6,
      "average": 3.4
    }
  ],
  "evaluators": [
    {
      "id": 2,
      "name": "evaluador1",
      "role": "evaluador-frontend",
      "completed": 3,
      "in_progress": 1,
      "average_score": 3.9
    }
  ],
  "timeline": [
    {
      "date": "2026-05-25",
      "evaluations": 2,
      "average": 3.5
    }
  ]
}
```

---

## Por qué Python para la analítica

Python es una buena decisión para esta capa porque el backend ya está en FastAPI y SQLAlchemy, y permite crecer después hacia:

* cálculos estadísticos más avanzados;
* detección de tendencias;
* comparación entre evaluadores;
* identificación automática de dimensiones críticas;
* análisis de comentarios cualitativos;
* exportación a Excel/PDF;
* eventualmente pandas, numpy o modelos de lenguaje para insights.

Para una primera versión no hace falta meter pandas. SQLAlchemy + Python puro alcanza. Pandas tendría sentido cuando se quiera exportar, cruzar muchas tablas o hacer análisis más pesado.

---

## Gráficos recomendados con Chart.js

En frontend se debería reemplazar Recharts en:

```text
frontend/src/app/project/[id]/analytics/page.tsx
```

Por Chart.js usando:

```bash
npm install chart.js react-chartjs-2
```

### Gráficos iniciales

* **Bar chart**: promedio por heurística/dimensión.
* **Radar chart**: perfil global del proyecto por dimensiones.
* **Doughnut chart**: completadas vs incompletas vs borradores.
* **Line chart**: evolución del puntaje promedio en el tiempo.
* **Stacked bar**: advertencias por evaluador o por tipo de evaluación.

### KPIs visibles

* Puntaje promedio general.
* Total de evaluaciones.
* Evaluaciones completadas.
* Evaluaciones incompletas.
* Porcentaje de avance real.
* Heurística mejor puntuada.
* Heurística con peor desempeño.
* Total de advertencias críticas.
* Tipo de evaluación más recurrente.

---

## Qué le falta al proyecto para que las analíticas queden bien estructuradas

### 1. Normalizar estados de evaluación

Ya se corrigió parte de esto, pero conviene formalizar estados válidos:

```text
borrador
incompleta
completada
archivada
```

Idealmente agregar un `CHECK` en `init-bd/tablas.sql` o validación de servicio para evitar estados inconsistentes.

### 2. Guardar progreso y resultados de forma coherente

Actualmente `progress_percentage`, `answered_count` y `total_questions` se calculan desde relaciones. Está bien para empezar, pero para analíticas grandes podría ser útil guardar snapshots calculados:

```text
evaluation_metrics
```

Campos posibles:

* `evaluation_id`
* `project_id`
* `plantilla_id`
* `answered_count`
* `total_questions`
* `progress_percentage`
* `average_score`
* `warnings`
* `updated_at`

Esto no es obligatorio ahora. Se puede empezar calculando en vivo y optimizar después.

### 3. Mejorar `resultados_dimensiones`

La tabla existe y es valiosa. Para analíticas se debe asegurar que:

* se recalcula cuando se edita una evaluación;
* no conserva resultados viejos;
* diferencia preguntas no aplicables (`N/A`);
* guarda `total_preguntas` real de la dimensión, no solo respondidas;
* registra `respondidas` correctamente.

### 4. Excluir o separar evaluaciones incompletas

En analytics se debe decidir si una evaluación incompleta:

* no entra en el promedio general;
* entra parcialmente con una etiqueta;
* aparece en una métrica separada de avance.

Recomendación:

* KPIs de avance: incluir borradores/incompletas.
* KPIs de calidad/promedio: usar solo completadas por defecto.
* Permitir un filtro "Incluir incompletas".

### 5. Asociar analíticas con roles/enfoques de evaluador

Como ya existe `evaluator_project_assignments.role`, se puede cruzar:

* rendimiento por `evaluador-frontend`;
* hallazgos por `Evaluador UX`;
* advertencias por responsable UI;
* tipos de evaluación asignados vs realizados.

Esto ayuda a entender qué está haciendo cada evaluador y qué parte del producto está más débil.

### 6. Crear schemas Pydantic específicos

No conviene devolver objetos ORM crudos. Crear schemas como:

```text
AnalyticsSummaryResponse
HeuristicMetricResponse
EvaluatorMetricResponse
TimelineMetricResponse
ProjectAnalyticsResponse
```

Así el frontend recibe datos limpios, estables y fáciles de graficar.

### 7. Permisos

El endpoint de analytics debería validar permisos:

* `ADMIN`: puede ver todo.
* `VIEW_REPORTS`: puede ver analíticas.
* Evaluadores asignados al proyecto: pueden ver analíticas del proyecto si tienen permiso.

No dejar analytics abierto sin JWT.

---

## Cambios sugeridos en base de datos

Por ahora el modelo actual alcanza para una primera versión.

Opcional a futuro:

```sql
CREATE TABLE evaluation_metrics (
  id SERIAL PRIMARY KEY,
  evaluation_id INT UNIQUE REFERENCES evaluaciones(id) ON DELETE CASCADE,
  project_id INT REFERENCES proyectos(id) ON DELETE CASCADE,
  plantilla_id INT REFERENCES plantillas(id),
  answered_count INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  progress_percentage INT DEFAULT 0,
  average_score DECIMAL(5,2),
  warnings INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Si se agrega esta tabla, también debe quedar en:

```text
init-bd/tablas.sql
backend/src/infrastructure/models.py
```

Regla importante: cada cambio estructural de base de datos debe reflejarse en `init-bd/tablas.sql`, para que una instalación desde cero quede completa.

---

## Plan de implementación por fases

### Fase 1: API analítica mínima

* Crear `analytics_repository.py`.
* Crear `analytics_service.py`.
* Crear `analytics.py` router.
* Agregar endpoint `GET /analytics/projects/{project_id}`.
* Calcular:
  * total de evaluaciones;
  * completadas;
  * incompletas;
  * promedio por dimensión;
  * warnings;
  * tipos más recurrentes;
  * métricas por evaluador.

### Fase 2: Frontend con Chart.js

* Instalar `chart.js` y `react-chartjs-2`.
* Crear servicio frontend:

```text
frontend/src/features/analytics/services/analytics.service.ts
```

* Reemplazar datos mock de `project/[id]/analytics/page.tsx`.
* Crear componentes:

```text
frontend/src/features/analytics/components/HeuristicBarChart.tsx
frontend/src/features/analytics/components/ProjectRadarChart.tsx
frontend/src/features/analytics/components/EvaluationStatusChart.tsx
frontend/src/features/analytics/components/TimelineChart.tsx
```

### Fase 3: Filtros

Agregar filtros por:

* tipo de evaluación;
* evaluador;
* enfoque/rol asignado;
* estado;
* rango de fechas;
* incluir/excluir incompletas.

### Fase 4: Insights

Generar insights automáticos:

* peor dimensión;
* mejor dimensión;
* dimensión con más advertencias;
* evaluador con más avances;
* tipo de evaluación más frecuente;
* recomendación de acción prioritaria.

### Fase 5: Exportación

Exportar:

* PDF de resultados;
* Excel con métricas;
* CSV de respuestas;
* resumen ejecutivo del proyecto.

---

## Recomendación final

El proyecto ya tiene una base suficiente para empezar analytics sin rediseñar todo.

Lo más importante antes de construir gráficos bonitos es crear un contrato de datos limpio desde Python. Si el backend entrega un objeto `ProjectAnalyticsResponse` bien estructurado, Chart.js solo se encarga de pintar.

Mi recomendación técnica:

1. Crear módulo `analytics` separado.
2. Empezar sin tablas nuevas, calculando desde `evaluaciones`, `respuestas`, `resultados_dimensiones` y asignaciones.
3. Agregar `evaluation_metrics` solo si el rendimiento empieza a ser un problema o si se necesitan snapshots históricos.
4. Mantener `init-bd/tablas.sql` como fuente completa para instalaciones nuevas.
