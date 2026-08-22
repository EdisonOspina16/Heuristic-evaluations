# PLAN DE PRUEBAS

**Proyecto:** Evaluaciones Heurísticas  
**Versión:** 1.0 
**Fecha:** 10/06/2026  
**Equipo de Pruebas:** [Por definir]  

---

## 1. Introducción

### 1.1 Propósito del documento

El propósito de este documento es definir el plan de pruebas para el sistema **Evaluaciones Heurísticas**, estableciendo el alcance, enfoque, niveles, tipos y técnicas de prueba que se aplicarán durante el proceso de validación y verificación del software.

Este plan describe **qué se va a probar, cómo se va a probar, con qué herramientas y bajo qué condiciones**, tomando como base la documentación disponible del proyecto, principalmente `requisitos.md`, `DESARROLLO.md`, `analiticas.md`, `README.MD`, `Comandos_Terminal.md` y la documentación del frontend.

Este documento no corresponde a un informe de resultados. Por lo tanto, no incluye veredictos de aprobación/fallo de pruebas ni métricas de ejecución final. Su objetivo es servir como guía previa para organizar, diseñar y ejecutar las actividades de prueba.

### 1.2 Alcance del documento

El documento cubre la planificación de pruebas para los módulos principales del sistema de Evaluaciones Heurísticas, separando las actividades de Backend y Frontend cuando aplica.

El alcance incluye:

- Definición del contexto funcional y técnico del sistema.
- Identificación de los artefactos que servirán como base de pruebas.
- Definición de objetivos de prueba específicos para el proyecto.
- Delimitación de funcionalidades incluidas y excluidas.
- Estrategia de pruebas para Backend, Frontend, seguridad, rendimiento, accesibilidad, analíticas y regresión.
- Identificación de niveles de prueba aplicables.
- Identificación de técnicas de diseño de pruebas apropiadas para el producto.


### 1.3 Referencias



## 2. Descripción del Producto

### 2.1 Descripción general del software

**Evaluaciones Heurísticas** es una plataforma web para gestionar y ejecutar procesos de evaluación heurística sobre proyectos. El sistema permite registrar usuarios, autenticar sesiones, administrar roles y permisos, asignar evaluadores a proyectos, registrar progreso de evaluaciones, visualizar métricas y consultar analíticas relacionadas con la calidad de las evaluaciones.

El producto integra una interfaz moderna basada en **Next.js, React y TypeScript**, con un backend desarrollado en **Python/FastAPI** bajo una arquitectura organizada por capas. La persistencia de datos se realiza en **PostgreSQL**, con uso de modelos relacionales para usuarios, roles, permisos, proyectos, asignaciones, plantillas, evaluaciones, respuestas, progreso y resultados por dimensión.

### 2.2 Contexto organizacional

El sistema está orientado a equipos que realizan evaluaciones heurísticas de usabilidad, UX, accesibilidad, contenido u otros enfoques operativos definidos por administradores. La plataforma contempla roles diferenciados, principalmente:

- **ADMIN:** usuario con control administrativo sobre usuarios, roles, permisos, proyectos, asignaciones y reportes.
- **EVALUADOR:** usuario encargado de participar en evaluaciones asignadas y registrar respuestas/progreso según sus permisos.

El proyecto busca centralizar la administración de evaluaciones heurísticas y apoyar la toma de decisiones mediante métricas, visualización de datos y analíticas por proyecto.

### 2.3 Arquitectura general

La arquitectura general identificada es la siguiente:

| Capa | Tecnología / componente | Descripción |
|------|--------------------------|-------------|
| Frontend | Next.js, React, TypeScript | Interfaz web, páginas de autenticación, dashboard, administración de cuenta, roles, permisos, usuarios, proyectos, evaluaciones y analíticas. |
| UI/Componentes | React, Tailwind, componentes propios | Componentes visuales reutilizables como botones, inputs, tarjetas, badges, sidebar, formularios y layout responsivo. |
| Servicios Frontend | Axios / servicios TypeScript | Comunicación con la API para autenticación, evaluaciones, proyectos y permisos. |
| Backend | FastAPI, Python | API REST para autenticación, usuarios, roles, permisos, proyectos, plantillas y evaluaciones. |
| Aplicación | Servicios de negocio | Reglas de autenticación, autorización RBAC, seguridad, evaluación y cálculo de resultados. |
| Dominio | Schemas, repositorios e interfaces | Modelos de datos, contratos Pydantic y abstracciones de repositorio. |
| Infraestructura | SQLAlchemy, repositorios concretos | Acceso a base de datos y persistencia relacional. |
| Base de datos | PostgreSQL / Supabase | Persistencia de usuarios, roles, permisos, proyectos, asignaciones, plantillas, respuestas, progreso y resultados. |
| CI/CD | Jenkins | Automatización esperada de construcción, análisis y ejecución de pruebas. |
| Calidad estática | SonarQube, ESLint, auditoría de dependencias | Validación estática de código, estilo, seguridad y dependencias. |

### 2.4 Procesos, módulos y funcionalidades

1. **Módulo de Autenticación y Gestión de Sesión**  
   Gestiona registro multi-paso, login seguro con JWT, hash de contraseñas, validación de usuarios activos y cierre de sesión mediante limpieza de datos locales.

2. **Sistema de Autorización RBAC inspirado en SonarQube**  
   Calcula permisos efectivos a partir de roles y permisos directos. Incluye validación de JWT, estado activo del usuario, permisos por endpoint y guards visuales en frontend.

3. **Módulo de Gestión y Administración de Usuarios**  
   Permite listar usuarios, buscar por nombre/correo, crear usuarios desde administración, activar/desactivar cuentas, eliminar usuarios y reasignar roles.

4. **Módulo de Permisos Globales y Asignación Directa**  
   Permite seleccionar usuarios y asignar permisos directos mediante checklist. Este módulo queda excluido del alcance de pruebas definido para este plan.

5. **Directorio de Roles del Sistema**  
   Permite visualizar roles base, jerarquía de roles y permisos asociados a cada rol.

6. **Módulo de Gestión de Proyectos**  
   Administra listado, creación, detalle y eliminación de proyectos. Este módulo queda excluido del alcance de pruebas definido para este plan.

7. **Motor de Ejecución de Evaluaciones Heurísticas**  
   Gestiona plantillas, dimensiones, preguntas, respuestas, comentarios y cálculo de resultados. Este módulo queda excluido del alcance de pruebas definido para este plan.

8. **Módulo de Analíticas y Visualización de Datos**  
   Incluye KPIs, métricas por proyecto, gráficos, estado de evaluaciones, promedio por dimensión, warnings e insights automáticos. La documentación sugiere separar API analítica, servicios, filtros e insights.

9. **Asignación de Evaluadores por Proyecto y Tipo de Evaluación**  
   Permite asignar evaluadores a proyectos, definir enfoques o roles operativos y controlar tipos de evaluación permitidos.

10. **Persistencia de Progreso y Reanudación de Evaluaciones**  
   Permite guardar borradores, registrar progreso y reanudar evaluaciones incompletas.

11. **Métricas de Recurrencia de Tipos de Evaluación**  
   Permite observar tipos de evaluación más frecuentes y apoyar la distribución del trabajo entre evaluadores.

12. **Preferencias de Tema Visual**  
   Permite alternancia visual claro/oscuro y persistencia de preferencia de interfaz.

13. **Arquitectura de Software y Base de Datos**  
   Comprende la organización técnica del backend, modelos relacionales, script de inicialización `init-bd/tablas.sql` y estructura por capas.

---

## 3. Base de Pruebas (Test Basis)

Los artefactos que servirán como base para diseñar las pruebas son:

| Base de prueba | Estado | Uso esperado |
|----------------|--------|-------------|
| `requisitos.md` | Disponible | Identificar módulos, reglas funcionales, permisos, flujos, entidades y restricciones. |
| `DESARROLLO.md` | Disponible | Identificar reglas de roles, permisos, endpoints sugeridos, restricciones de seguridad y decisiones de implementación. |
| `analiticas.md` | Disponible | Diseñar pruebas para analíticas, KPIs, filtros, insights, permisos y contratos de datos. |
| `README.MD` | Disponible | Definir comandos de ejecución y pruebas con coverage para backend y frontend. |
| `Comandos_Terminal.md` | Disponible | Confirmar comandos operativos del proyecto. |
| `frontend/README.md` | Disponible | Contextualizar ejecución local del frontend Next.js. |
| `frontend/AGENTS.md` | Disponible | Considerar restricciones de la versión de Next.js al probar o modificar frontend. |
| Código fuente Backend | Disponible | Diseñar pruebas unitarias, API, integración, seguridad y rendimiento. |
| Código fuente Frontend | Disponible | Diseñar pruebas unitarias, componentes, E2E, accesibilidad, seguridad y rendimiento. |
| `init-bd/tablas.sql` | Disponible | Validar estructura de base de datos, llaves, datos semilla y relaciones. |
| `docker-compose.yml` y `docker-compose.e2e.yml` | Disponible | Definir escenarios de entorno local, CI/CD y ejecución E2E. |
| Historias de usuario | [Por definir] | Esta sección queda pendiente porque no existe un documento formal de historias de usuario en el contexto disponible. |
| Casos de prueba detallados | [Por definir] | Se diseñarán posteriormente a partir de este plan, requisitos y criterios de aceptación definidos por el equipo. |
| Criterios de aceptación | [Por definir] | Se requiere validación del equipo funcional o cliente. |

---

## 4. Objetivos de las Pruebas

Los objetivos de las pruebas para el sistema Evaluaciones Heurísticas son:

1. Verificar que los flujos de autenticación funcionen de forma segura, incluyendo registro, login, logout, JWT, hash de contraseñas y bloqueo de usuarios inactivos.
2. Validar que el modelo RBAC aplique correctamente roles, permisos efectivos, permisos directos y restricciones visuales en frontend.
3. Verificar la administración de usuarios, incluyendo listado, búsqueda, creación, cambio de estado, eliminación y reasignación de roles.
4. Validar que el directorio de roles muestre información consistente sobre roles base y permisos asociados.
5. Verificar que la asignación de evaluadores por proyecto y tipo de evaluación respete reglas de permisos, visibilidad y tipos permitidos.
6. Validar que el progreso de evaluaciones pueda persistirse y reanudarse de forma coherente.
7. Verificar que las métricas de recurrencia y analíticas presenten datos consistentes, calculados desde entidades reales del sistema.
8. Validar que las preferencias de tema visual se apliquen y persistan correctamente.
9. Verificar la integridad de la arquitectura backend, repositorios, servicios, modelos y contratos Pydantic.
10. Validar la comunicación entre frontend y backend mediante servicios HTTP y manejo adecuado de errores.
11. Evaluar seguridad básica de autenticación, autorización, dependencias, entradas maliciosas, XSS y control de acceso.
12. Evaluar rendimiento de endpoints y componentes críticos bajo escenarios representativos.
13. Evaluar accesibilidad de pantallas principales mediante herramientas automatizadas y criterios WCAG aplicables.
14. Integrar la ejecución de pruebas automatizadas dentro de una estrategia compatible con Jenkins/CI.

---

## 5. Alcance

### 5.1 Funcionalidades incluidas

Las funcionalidades incluidas en este plan de pruebas son:

1. **Autenticación y Gestión de Sesión**  
   Registro multi-paso, primer administrador automático, login con JWT, hash de contraseña, usuarios inactivos y logout.

2. **Sistema RBAC y autorización**  
   Cálculo de permisos efectivos, permisos por rol, permisos directos a nivel conceptual, middleware de autorización, ADMIN bypass y guards de interfaz.

3. **Gestión y Administración de Usuarios**  
   Directorio de usuarios, búsqueda, creación administrativa, activación/desactivación, eliminación y asignación de roles.

4. **Directorio de Roles del Sistema**  
   Visualización de roles base, permisos asociados y jerarquía de roles.

5. **Analíticas y Visualización de Datos**  
   KPIs, promedios por dimensión, estado de evaluaciones, tipos recurrentes, warnings, gráficos e insights automáticos planificados.

6. **Asignación de Evaluadores por Proyecto y Tipo de Evaluación**  
   Asignación administrativa, visibilidad de proyectos asignados, enfoques de trabajo y tipos permitidos.

7. **Persistencia de Progreso y Reanudación**  
   Guardado de borradores, respuestas parciales, porcentaje de avance y reanudación de trabajo incompleto.

8. **Métricas de Recurrencia de Tipos de Evaluación**  
   Identificación de tipos de evaluación más frecuentes para apoyar la distribución operativa.

9. **Preferencias de Tema Visual**  
   Alternancia claro/oscuro y persistencia de preferencia.

10. **Arquitectura de Software y Base de Datos**  
   Validación de estructura por capas, modelos relacionales, scripts SQL, repositorios y servicios.

### 5.2 Funcionalidades excluidas

| Módulo excluido | Justificación |
|-----------------|---------------|
| 4. Módulo de Permisos Globales y Asignación Directa | Excluido del alcance solicitado para este plan. Se podrá planificar en una fase posterior cuando el equipo confirme criterios de aceptación y flujos específicos. |
| 6. Módulo de Gestión de Proyectos | Excluido del alcance solicitado para este plan. Solo se considerará como dependencia contextual para asignaciones, evaluaciones y analíticas. |
| 7. Motor de Ejecución de Evaluaciones Heurísticas | Excluido del alcance solicitado para este plan. Solo se considerará como dependencia contextual de progreso, analíticas y persistencia. |

### 5.3 Supuestos

- El sistema será probado inicialmente en un entorno local/de desarrollo.
- El frontend se ejecutará desde la carpeta `frontend` mediante `npm install` y `npm run dev`.
- El backend se ejecutará desde la carpeta `backend`, usando entorno virtual `.venv` y FastAPI/Uvicorn.
- La base de datos será PostgreSQL, posiblemente alojada en Supabase o en una instancia local compatible.
- Las pruebas automatizadas de backend se diseñarán principalmente con `pytest`.
- Las pruebas automatizadas de frontend se diseñarán principalmente con `Jest`, `Testing Library`, `Cypress`, `Playwright`, `Stagehand`, `DeepEval` y `Lighthouse` según aplique.
- Jenkins será considerado como plataforma de CI/CD para ejecutar pruebas, análisis y validaciones automáticas.
- SonarQube será considerado como herramienta de análisis estático y seguimiento de calidad.
- Las historias de usuario y casos de prueba detallados serán definidos posteriormente por el equipo.

### 5.4 Restricciones

- No se cuenta con historias de usuario formales en los archivos del proyecto.
- No se cuenta con una matriz final de casos de prueba aprobada por el equipo.
- Algunos escenarios dependen de disponibilidad y configuración de PostgreSQL/Supabase.
- Las pruebas E2E requieren que backend, frontend y base de datos estén levantados y sincronizados.
- Las pruebas con Lighthouse, Playwright, Cypress y Stagehand requieren navegador compatible y entorno local estable.
- Las pruebas de analíticas dependen de datos suficientes en evaluaciones, respuestas, resultados y asignaciones.
- La documentación indica que la versión de Next.js puede tener cambios importantes, por lo que las pruebas y ajustes deben respetar la documentación local del framework.
- Los criterios de aceptación funcional y umbrales definitivos de calidad deben ser confirmados por el equipo.
- El alcance excluye explícitamente permisos globales/asignación directa, gestión de proyectos y motor de ejecución de evaluaciones heurísticas.

---

## 6. Enfoque y Estrategia de Pruebas

La estrategia de pruebas se organizará por capas, priorizando primero la validación aislada de lógica crítica y luego la integración entre componentes.

### Estrategia general

1. **Revisión estática inicial**  
   Revisar requisitos, arquitectura, código fuente, dependencias, scripts, convenciones y estructura de base de datos antes de diseñar pruebas dinámicas.

2. **Pruebas unitarias Backend**  
   Validar servicios, repositorios, reglas de seguridad, cálculo de permisos, validaciones de usuarios, evaluaciones, progreso y persistencia.

3. **Pruebas unitarias/componentes Frontend**  
   Validar servicios TypeScript, componentes React, páginas, guards visuales, formularios y manejo de estados.

4. **Pruebas API e integración Backend**  
   Validar endpoints REST, autenticación JWT, permisos por endpoint, respuestas HTTP, errores esperados, estructura JSON y reglas de negocio.

5. **Pruebas E2E Frontend**  
   Validar flujos completos desde la perspectiva del usuario: registro, login, navegación administrativa, gestión de usuarios, roles, asignaciones, analíticas y preferencias visuales.

6. **Pruebas no funcionales**  
   Ejecutar validaciones de seguridad, accesibilidad, rendimiento, auditoría de dependencias y calidad estática.

7. **Pruebas de regresión**  
   Automatizar suites críticas para ejecutarlas en cada cambio relevante o pipeline de Jenkins.

### Separación por capa

| Capa | Enfoque |
|------|---------|
| Backend | `pytest`, pruebas unitarias, API, seguridad, repositorios, servicios, base de datos y rendimiento con Locust. |
| Frontend | `Jest`, Testing Library, Cypress, BDD/Gherkin, Playwright, Stagehand, DeepEval, Lighthouse y pruebas de accesibilidad. |
| Base de datos | Validación de estructura, relaciones, datos semilla, restricciones, cascadas e integridad referencial. |
| CI/CD | Jenkins para instalar dependencias, ejecutar pruebas, lint, análisis estático y reportes. |

### Estrategia manual y automatizada

- Las pruebas repetibles, críticas y de regresión deberán automatizarse.
- Las pruebas exploratorias se usarán para validar experiencia de usuario, consistencia visual, usabilidad y flujos no cubiertos inicialmente.
- Las pruebas manuales deberán documentarse posteriormente como casos de prueba detallados.
- Las pruebas automatizadas deberán organizarse por tipo, capa y criticidad.

---

## 7. Niveles de Prueba

| Nivel de prueba | Backend | Frontend | Herramientas | Responsable sugerido |
|-----------------|---------|----------|--------------|----------------------|
| Unitarias | Servicios, repositorios, validaciones, seguridad, lógica RBAC, cálculos de evaluación y progreso. | Servicios TypeScript, hooks, componentes, páginas y guards. | `pytest`, `Jest`, Testing Library. | QA Automation / Desarrolladores. |
| Integración | Endpoints con repositorios, base de datos, JWT, permisos y modelos. | Integración de páginas con servicios HTTP y estado de sesión. | `pytest`, `httpx`, `Jest`, mocks controlados, entorno local. | QA Automation / Backend / Frontend. |
| Sistema | Flujo completo de módulos incluidos en entorno integrado. | Navegación real entre pantallas, sesiones y flujos administrativos. | Cypress, Playwright, Stagehand. | QA Automation. |
| Aceptación | Validación contra criterios funcionales del negocio. | Validación de flujos visibles para ADMIN y EVALUADOR. | BDD/Gherkin, ScreenPlay, revisión funcional. | QA + Product Owner / Cliente. |
| Regresión | Reejecución de suites críticas tras cambios. | Reejecución de suites unitarias, componentes, E2E y accesibilidad. | Jenkins, `pytest`, `npm test`, Cypress. | QA Automation / DevOps. |
| No funcional | Seguridad, rendimiento, dependencias, API y BD. | Accesibilidad, rendimiento web, dependencias y UX básica. | Bandit, pip-audit, npm audit, Locust, Lighthouse, axe-core. | QA Automation / Seguridad / DevOps. |

Historias de usuario asociadas a cada nivel: [Por definir].  
Casos de prueba asociados a cada nivel: [Por definir].

---

## 8. Tipos de Prueba

### 8.1 Pruebas funcionales

Las pruebas funcionales verificarán que el sistema cumpla los requisitos descritos para cada módulo incluido.

| Tipo | Backend | Frontend | Herramientas |
|------|---------|----------|--------------|
| Autenticación | Registro, login, logout, JWT, usuario inactivo, hash de contraseña. | Formularios de login/registro, validaciones, redirección y persistencia local. | `pytest`, `Jest`, Cypress. |
| Autorización RBAC | Permisos por rol, permisos efectivos, ADMIN bypass, bloqueo de acciones no autorizadas. | Guards visuales, navegación condicional, visibilidad de acciones. | `pytest`, `Jest`, Cypress. |
| Gestión de usuarios | Crear, listar, buscar, activar/desactivar, eliminar y asignar roles. | Tabla de usuarios, formularios, modales, mensajes y acciones. | `pytest`, `Jest`, Cypress. |
| Roles | Consulta de roles base y permisos asociados. | Pantalla/directorio de roles y permisos visibles. | `pytest`, `Jest`. |
| Asignaciones | Asignar evaluadores a proyectos y tipos de evaluación permitidos. | Matrices, formularios y vistas de asignación. | `pytest`, `Jest`, Cypress. |
| Progreso y reanudación | Persistir progreso, respuestas parciales y recuperación de estado. | UI de progreso, contadores, estados vacíos y reanudación. | `pytest`, `Jest`, Cypress. |
| Analíticas | Contratos de datos, KPIs, promedios, warnings, tipos recurrentes e insights. | Dashboards, gráficos, filtros y tarjetas de recomendación. | `pytest`, `Jest`, Lighthouse, pruebas visuales básicas. |
| Tema visual | Persistencia de preferencia y aplicación de modo claro/oscuro. | Toggle, estilos y consistencia visual. | `Jest`, Testing Library, Cypress. |

Casos de prueba funcionales detallados: [Por definir].

### 8.2 Pruebas no funcionales

| Tipo no funcional | Objetivo | Herramientas | Criterios / umbrales |
|-------------------|----------|--------------|----------------------|
| Seguridad Backend | Validar autenticación, autorización, payloads malformados, XSS tratado como texto, permisos y dependencias. | `pytest`, Bandit, pip-audit. | Sin vulnerabilidades críticas/altas pendientes; criterios exactos [Por definir]. |
| Seguridad Frontend | Validar dependencias, manejo de sesión local, exposición de acciones según permisos y flujos protegidos. | npm audit, Cypress security, Jest. | Sin vulnerabilidades críticas/altas pendientes; criterios exactos [Por definir]. |
| Rendimiento Backend | Evaluar tiempos de respuesta y estabilidad bajo carga representativa. | Locust. | Usuarios concurrentes, latencia objetivo y tasa de error [Por definir]. |
| Rendimiento Frontend | Evaluar renderizado de componentes, actualización masiva de respuestas y páginas principales. | Jest performance, Lighthouse. | Umbrales por componente/página [Por definir]. |
| Accesibilidad | Validar pantallas principales contra reglas automatizadas de accesibilidad. | Cypress + cypress-axe / axe-core. | Cumplimiento automatizado sin violaciones críticas; nivel WCAG objetivo [Por definir]. |
| Usabilidad | Revisar claridad de flujos, mensajes, navegación, formularios y estados vacíos. | Pruebas exploratorias, revisión heurística. | Criterios cualitativos [Por definir]. |
| Compatibilidad | Validar funcionamiento en navegadores objetivo. | Cypress, Playwright, pruebas manuales. | Navegadores objetivo [Por definir]. |
| Integridad de datos | Validar relaciones, cascadas, unicidad, consistencia de respuestas y resultados. | SQL, `pytest`, inspección de `tablas.sql`. | Reglas de integridad definidas en base de datos. |

### 8.3 Pruebas estáticas

Las pruebas estáticas se aplicarán antes y durante la ejecución dinámica para detectar defectos tempranos.

- **Revisión de requisitos:** validar consistencia, completitud y ambigüedades en `requisitos.md` y `DESARROLLO.md`.
- **Revisión de arquitectura:** validar separación entre dominio, aplicación, infraestructura e interfaces en Backend.
- **Revisión de frontend:** validar organización de páginas, componentes, servicios, hooks y rutas.
- **SonarQube:** analizar mantenibilidad, duplicación, code smells, cobertura esperada y posibles vulnerabilidades.
- **ESLint:** validar reglas de estilo y calidad en frontend.
- **Bandit:** identificar patrones inseguros en código Python.
- **pip-audit:** auditar dependencias Python.
- **npm audit:** auditar dependencias JavaScript/TypeScript.
- **Revisión de base de datos:** validar `init-bd/tablas.sql`, llaves foráneas, cascadas, constraints, índices y datos semilla.

### 8.4 Pruebas de regresión

La regresión deberá cubrir los flujos críticos y ejecutarse ante cambios en autenticación, autorización, usuarios, roles, asignaciones, analíticas, progreso, base de datos o dependencias.

Estrategia propuesta:

1. Mantener una suite mínima de regresión para cada pull request o cambio importante.
2. Ejecutar pruebas unitarias de Backend con `pytest`.
3. Ejecutar pruebas unitarias/componentes de Frontend con `npm test`.
4. Ejecutar pruebas E2E críticas con Cypress sobre entorno integrado.
5. Ejecutar auditorías de seguridad de dependencias en Backend y Frontend.
6. Ejecutar pruebas de accesibilidad en pantallas principales.
7. Ejecutar pruebas de rendimiento de forma programada o antes de releases.
8. Integrar la ejecución en Jenkins con reportes descargables o visibles para el equipo.

Casos de regresión definitivos: [Por definir].

---

## 9. Técnicas de Diseño de Pruebas

Las técnicas de diseño de pruebas aplicables al proyecto son:

| Técnica | Aplicación en el proyecto |
|--------|----------------------------|
| Partición de equivalencia | Clasificar entradas válidas e inválidas para login, registro, creación de usuarios, roles, permisos, asignaciones, respuestas y filtros. |
| Análisis de valores límite | Validar límites de campos como contraseña, correo, nombre, IDs, número de preguntas, puntajes, porcentajes de progreso y rangos de fechas. |
| Tablas de decisión | Diseñar combinaciones de rol, permiso, estado de usuario y acción permitida/no permitida en RBAC. |
| Pruebas de transición de estados | Validar cambios de usuario activo/inactivo, progreso de evaluación, borrador/completada e inicio/cierre de sesión. |
| Pruebas de casos de uso | Diseñar flujos completos para ADMIN y EVALUADOR cuando las historias de usuario sean definidas. |
| BDD/Gherkin | Describir escenarios legibles en formato Dado/Cuando/Entonces para autenticación, dashboard, registro, logout y evaluación. |
| Patrón ScreenPlay | Modelar actores, tareas, interacciones y preguntas en pruebas BDD/E2E. |
| Patrón AAA | Estructurar pruebas unitarias en Arrange, Act, Assert para mejorar claridad y mantenibilidad. |
| Principios FIRST | Mantener pruebas rápidas, independientes, repetibles, auto-verificables y oportunas. |
| Pruebas basadas en riesgo | Priorizar autenticación, autorización, administración de usuarios, integridad de datos, seguridad y analíticas. |
| Pruebas exploratorias | Complementar automatización revisando UX, mensajes, navegación, estados vacíos, accesibilidad visual y comportamiento inesperado. |
| Pruebas con datos sintéticos | Crear usuarios, roles, permisos, proyectos, asignaciones y evaluaciones controladas para evitar dependencia de datos productivos. |
| Pruebas de contrato API | Validar estructura JSON, códigos HTTP, schemas Pydantic y compatibilidad entre frontend y backend. |
| Pruebas de seguridad negativa | Intentar acciones sin token, token inválido, usuario inactivo, permisos insuficientes, payloads malformados e inyección HTML/XSS. |
| Pruebas de accesibilidad automatizada | Usar reglas axe-core para detectar problemas comunes de accesibilidad en pantallas principales. |

Historias de usuario para derivar escenarios concretos: [Por definir].  
Casos de prueba derivados de estas técnicas: [Por definir].
