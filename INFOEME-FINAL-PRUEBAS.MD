# INFORME FINAL DE PRUEBAS

Proyecto: Evaluaciones Heurísticas  
Versión evaluada: Frontend 0.1.0; Backend [No disponible]  
Fecha del informe: 10/06/2026  
Equipo de pruebas: [No disponible]

---

### 1. RESUMEN EJECUTIVO

Este informe presenta los resultados finales del proceso de validación y verificación del sistema Evaluaciones Heurísticas.

Se identificaron 441 casos de prueba diseñados en los archivos del proyecto: 203 asociados a Backend y 238 asociados a Frontend. Durante la ejecución automatizada realizada para este informe se ejecutaron 305 casos mediante `pytest` y `npm test`, alcanzando una cobertura funcional de alcance de 10 de 13 módulos en total, equivalente al 76.9% de los requisitos funcionales documentados.

En Backend se ejecutaron 158 pruebas con `pytest`: 70 aprobaron, 1 falló, 86 terminaron en error y 1 quedó marcada como `xfailed`. La causa dominante de los errores fue la imposibilidad de conexión desde el entorno de ejecución a la base de datos PostgreSQL remota de Supabase (`Permission denied` hacia `aws-1-us-east-2.pooler.supabase.com:5432`). Además, el ejecutable directo del `.venv` quedó apuntando a una ruta antigua de Python, por lo que la ejecución se realizó usando el runtime Python disponible y los paquetes instalados en `.venv\Lib\site-packages`.

En Frontend se ejecutaron 147 pruebas con `npm test`: 130 aprobaron y 17 fallaron. Los hallazgos principales se concentran en configuración Jest/Stagehand, uso de `expectThat`, datos indefinidos en pruebas de permisos, vulnerabilidades detectadas por `npm audit` y una prueba de rendimiento que superó el umbral esperado.

---

### 2. ALCANCE DE LAS PRUEBAS

#### 2.1 Funcionalidades evaluadas

1. Módulo de Autenticación y Gestión de Sesión.
2. Sistema de Autorización RBAC (Role-Based Access Control) inspirado en SonarQube.
3. Módulo de Gestión y Administración de Usuarios.
4. Directorio de Roles del Sistema.
5. Módulo de Analíticas y Visualización de Datos (Heuristic Analytics).
6. Asignación de Evaluadores por Proyecto y Tipo de Evaluación.
7. Persistencia de Progreso y Reanudación de Evaluaciones.
8. Métricas de Recurrencia de Tipos de Evaluación.
9. Preferencias de Tema Visual.
10. Arquitectura de Software y Base de Datos.

#### 2.2 Funcionalidades no evaluadas

- 4. Módulo de Permisos Globales y Asignación Directa — No fue evaluado por exclusión explícita indicada en el prompt de generación del informe.
- 6. Módulo de Gestión de Proyectos — No fue evaluado por exclusión explícita indicada en el prompt de generación del informe.
- 7. Motor de Ejecución de Evaluaciones Heurísticas — No fue evaluado por exclusión explícita indicada en el prompt de generación del informe.

---

### 3. ENTORNO DE PRUEBAS

Versión del sistema: Frontend 0.1.0; Backend [No disponible]  
Entorno: Desarrollo/local  
Base de datos: PostgreSQL remoto en Supabase; versión [No disponible]  
Navegadores utilizados: Jest/jsdom para `npm test`; Chromium/Chrome configurado para Playwright, Lighthouse y Cypress; navegador real de E2E [No disponible]  
Fecha(s) de ejecución: 10/06/2026

---

### 4. MÉTRICAS DE EJECUCIÓN

#### Backend

| Métrica                   | Backend | Frontend | TOTAL |
|---------------------------|---------|----------|-------|
| Total de requisitos       | 10      | 0        | 10    |
| Total de escenarios       | 44      | 0        | 44    |
| Total de casos diseñados  | 203     | 0        | 203   |
| Casos ejecutados          | 158     | 0        | 158   |
| Casos aprobados           | 70      | 0        | 70    |
| Casos fallidos            | 87      | 0        | 87    |

Detalle Backend identificado y ejecutado:

| Tipo de prueba | Archivos con casos | Casos diseñados |
|----------------|--------------------|-----------------|
| API | 12 | 75 |
| Unitarias | 13 | 87 |
| Seguridad | 4 | 15 |
| Rendimiento/Locust | 4 | 26 |
| **TOTAL Backend diseñado** | **33** | **203** |

Resultado `pytest` Backend:

| Resultado | Cantidad |
|-----------|----------|
| Pruebas recolectadas/ejecutadas | 158 |
| Aprobadas | 70 |
| Fallidas | 1 |
| Errores | 86 |
| XFailed | 1 |
| Warnings | 26 |

#### Frontend

| Métrica                   | Backend | Frontend | TOTAL |
|---------------------------|---------|----------|-------|
| Total de requisitos       | 0       | 10       | 10    |
| Total de escenarios       | 0       | 79       | 79    |
| Total de casos diseñados  | 0       | 238      | 238   |
| Casos ejecutados          | 0       | 147      | 147   |
| Casos aprobados           | 0       | 130      | 130   |
| Casos fallidos            | 0       | 17       | 17    |

Detalle Frontend identificado desde archivos de prueba:

| Tipo de prueba | Archivos con casos | Casos diseñados |
|----------------|--------------------|-----------------|
| Unitarias/componentes en `src` | 5 | 102 |
| Unitarias en `frontend/tests/unit` | 7 | 35 |
| E2E Cypress | 6 | 40 |
| Accesibilidad Cypress | 5 | 18 |
| Seguridad Cypress | 1 | 3 |
| Seguridad frontend | 1 | 1 |
| Rendimiento | 3 | 7 |
| BDD/Gherkin | 5 | 8 |
| IA/Stagehand | 1 | 18 |
| DeepEval | 4 | 6 |
| **TOTAL Frontend diseñado** | **38** | **238** |

Resultado `npm test` Frontend:

| Resultado | Cantidad |
|-----------|----------|
| Suites ejecutadas | 17 |
| Suites aprobadas | 9 |
| Suites fallidas | 8 |
| Pruebas ejecutadas | 147 |
| Aprobadas | 130 |
| Fallidas | 17 |
| Snapshots | 0 |

#### Consolidado total

| Métrica                   | Backend | Frontend | TOTAL |
|---------------------------|---------|----------|-------|
| Total de requisitos       | 10      | 10       | 10    |
| Total de escenarios       | 44      | 79       | 123   |
| Total de casos diseñados  | 203     | 238      | 441   |
| Casos ejecutados          | 158     | 147      | 305   |
| Casos aprobados           | 70      | 130      | 200   |
| Casos fallidos            | 87      | 17       | 104   |

---

### 5. GESTIÓN DE DEFECTOS

| Severidad          | Backend | Frontend | TOTAL |
|--------------------|---------|----------|-------|
| Críticos           | [No disponible] | [No disponible] | [No disponible] |
| Altos              | [No disponible] | [No disponible] | [No disponible] |
| Medios             | [No disponible] | [No disponible] | [No disponible] |
| Bajos              | [No disponible] | [No disponible] | [No disponible] |
| Abiertos           | 87 | 17 | 104 |
| Cerrados           | [No disponible] | [No disponible] | [No disponible] |

Backend: Se registraron 87 incidencias abiertas en la ejecución: 1 fallo y 86 errores. La mayoría de los errores corresponden a pruebas que intentan abrir conexión contra PostgreSQL remoto en Supabase y reciben `Permission denied` desde el entorno local. También se detectó 1 fallo en la suite de seguridad de dependencias (`test_dependencies_security_scan.py`). No se dispone de una clasificación formal por severidad para estos hallazgos.

Frontend: Se registraron 17 incidencias abiertas en la ejecución de `npm test`. Las fallas observadas incluyen error de parseo en `tests-AI/tests/evaluation-form.test.ts` por redeclaración de `__dirname`, errores por `expectThat` no disponible en `tests/unit/sidebar-admin-navigation.test.tsx`, fallas en pruebas de permisos por datos indefinidos, vulnerabilidades reportadas por `npm audit` en `tests/security/frontend_dependency_audit.test.ts` y una prueba de rendimiento en `tests/performance/evaluations.performance.test.tsx` que excedió el umbral de 1500 ms. No se dispone de una clasificación formal por severidad para estos hallazgos.

---

### 6. ANÁLISIS DE CALIDAD

Evaluación global del sistema: El proyecto presenta una estrategia de pruebas amplia y multicapa. En Backend existe cobertura diseñada para API, lógica unitaria, seguridad y rendimiento. En Frontend existe cobertura diseñada para componentes, flujos E2E, accesibilidad, seguridad, rendimiento, BDD, pruebas asistidas por IA y evaluación DeepEval. La ejecución real muestra que el Frontend tiene una tasa de aprobación de 88.4% sobre las pruebas ejecutadas con Jest (`130/147`) y que Backend requiere estabilizar el entorno de base de datos antes de interpretar los errores funcionalmente, ya que 86 pruebas fallaron por problemas de conexión al servicio PostgreSQL remoto.

Áreas con mayor concentración de fallos:
- Backend: conexión a base de datos PostgreSQL/Supabase en pruebas API, seguridad e integración; auditoría de dependencias en `test_dependencies_security_scan.py`.
- Frontend: configuración Jest/Stagehand, helper de aserciones `expectThat`, pruebas de permisos, auditoría de dependencias con `npm audit` y rendimiento del flujo de evaluaciones.

---

### 7. RIESGOS RESIDUALES

- Bloqueo de conexión a PostgreSQL remoto — Impacto: alto; Probabilidad: alta. Generó 86 errores en Backend e impide validar adecuadamente API, seguridad e integración.
- `.venv` backend con lanzadores rotos por ruta absoluta antigua de Python — Impacto: medio; Probabilidad: alta. El comando directo `pytest` no pudo iniciar porque apunta a `C:\Users\USER\AppData\Local\Programs\Python\Python312\python.exe`.
- Vulnerabilidades de dependencias detectadas por auditorías — Impacto: alto; Probabilidad: media. Backend falló en `test_dependencies_security_scan.py` y Frontend falló en `frontend_dependency_audit.test.ts`.
- Fallas de configuración de pruebas IA/Stagehand — Impacto: medio; Probabilidad: alta. `npm test` no puede parsear correctamente el helper de Stagehand por redeclaración de `__dirname`.
- Regresión o incompatibilidad en helper de aserciones `expectThat` — Impacto: medio; Probabilidad: alta. Afecta la suite de navegación administrativa del sidebar.
- Rendimiento insuficiente en actualización masiva de respuestas — Impacto: medio; Probabilidad: media. La prueba recibió 4427.07 ms frente a un umbral esperado menor a 1500 ms.
- Funcionalidades excluidas del alcance — Impacto: alto; Probabilidad: alta. Permisos globales/asignación directa, gestión de proyectos y motor de ejecución de evaluaciones heurísticas no fueron evaluados por instrucción explícita.

---

### 8. CONCLUSIONES

1. Backend cuenta con 203 casos diseñados y 158 pruebas ejecutadas por `pytest`; 70 aprobaron, pero 87 no pasaron, principalmente por bloqueo de conexión a la base de datos remota y una falla de auditoría de dependencias.
2. Frontend cuenta con 238 casos diseñados y 147 pruebas ejecutadas por `npm test`; 130 aprobaron y 17 fallaron, con problemas concentrados en configuración de pruebas, aserciones, seguridad de dependencias y rendimiento.
3. El sistema tiene una estrategia de validación robusta a nivel de diseño, con 441 casos identificados. Sin embargo, la liberación debe condicionarse a estabilizar el entorno de Backend, corregir fallas de Frontend y repetir la ejecución hasta obtener resultados consistentes.

---

### 9. RECOMENDACIÓN DE LIBERACIÓN

☐ Se recomienda la liberación del sistema.  
☒ Se recomienda la liberación condicionada.  
☐ No se recomienda la liberación.

Se recomienda liberación condicionada porque existe una base de pruebas amplia y parcialmente exitosa, pero la ejecución actual presenta 104 incidencias abiertas entre Backend y Frontend. Antes de una liberación sin condiciones se recomienda corregir la conexión de Backend a base de datos, reparar el `.venv`, resolver vulnerabilidades de dependencias, ajustar la configuración de Jest/Stagehand, corregir los helpers de aserción y repetir `pytest` y `npm test` hasta obtener una ejecución estable.

---

### 10. LECCIONES APRENDIDAS

- Cómo realizar pruebas unitarias con los principios FIRST, el patrón AAA y dobles de prueba como mocks.
- Identificar y utilizar las diferentes métricas aplicables en un plan de pruebas.
- Usar herramientas de análisis de código estático como SonarQube para apoyar la refactorización del proyecto.
- Reconocer la importancia de documentar todo lo realizado conforme avanza el tiempo.
- Integrar pruebas a CI/CD con pipelines para producción en Jenkins.
- Aplicar pruebas con Selenium o Katalon Recorder.
- Ejecutar pruebas E2E con Cypress, API, seguridad, regresión, accesibilidad y UI/componentes.
- Incorporar pruebas con IA, Playwright, Stagehand y DeepEval.
- Utilizar lenguaje Gherkin (Given, When, Then) y el patrón ScreenPlay para describir escenarios claros y reutilizables.

---

### 11. APROBACIONES

| Nombre | Rol | Firma | Fecha |
|--------|-----|-------|-------|
| [No disponible] | [No disponible] | [No disponible] | [No disponible] |
