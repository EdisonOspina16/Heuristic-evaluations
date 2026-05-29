# Requisitos y Funcionalidades del Sistema - Evaluaciones Heurísticas

Este documento detalla exhaustivamente todas las funcionalidades e implementaciones técnicas completadas hasta el momento en la plataforma de **Evaluaciones Heurísticas**. El sistema integra una interfaz de usuario moderna en el frontend basada en Next.js con un backend de alto rendimiento desarrollado en FastAPI bajo una arquitectura limpia y un sistema de base de datos relacional PostgreSQL.

---

## 1. Módulo de Autenticación y Gestión de Sesión

Este módulo se encarga del registro, inicio y mantenimiento seguro de la sesión del usuario.

* **Registro de Usuarios Multi-paso (Sign-Up)**:
  * Interfaz de registro secuencial dividida en tres pasos interactivos para mejorar la experiencia del usuario (Nombre completo $\rightarrow$ Correo electrónico $\rightarrow$ Contraseña).
  * Barra de progreso animada que indica visualmente el estado del registro.
  * Inicio de sesión automático tras un registro exitoso.
  * **Asignación Automática del Primer Administrador (Bootstrap)**: Si no existen usuarios en la base de datos, el primer usuario que se registre recibe de forma automática el rol de `ADMIN`. Los siguientes usuarios registrados de forma autónoma no pueden ser administradores y requieren ser gestionados por un administrador activo.
* **Inicio de Sesión Seguro (Login)**:
  * Autenticación basada en JSON Web Tokens (JWT) que expide un token de acceso firmado por el backend.
  * Verificación de credenciales en el backend con contraseñas cifradas en formato hash (`bcrypt`).
  * Persistencia segura del token de sesión (`access_token`) y de los metadatos esenciales del usuario en el navegador (`localStorage`).
  * Validación del estado de la cuenta: Los usuarios desactivados tienen el acceso denegado inmediatamente.
* **Cierre de Sesión (Logout)**:
  * Eliminación instantánea del token y los datos de sesión en el almacenamiento local del cliente (`localStorage`).

---

## 2. Sistema de Autorización RBAC (Role-Based Access Control) Inspirado en SonarQube

El sistema implementa un potente motor de control de accesos que combina la flexibilidad de los roles y la precisión de los permisos individuales.

* **Cálculo Unificado de Permisos**:
  * Los permisos efectivos de un usuario en un momento dado se calculan dinámicamente mediante la unión de:
    $$\text{Permisos Finales} = \text{Permisos del Rol} \cup \text{Permisos Directos}$$
* **Sistema de Permisos Globales**:
  * Lista de 11 permisos globales independientes del rol:
    * `MANAGE_USERS`: Permite gestionar estados y eliminar usuarios.
    * `CREATE_USERS`: Permite dar de alta a nuevos usuarios.
    * `EDIT_USERS`: Permite editar detalles de cuentas.
    * `DELETE_USERS`: Permite eliminar usuarios del sistema.
    * `ASSIGN_ROLES`: Permite reasignar roles de usuario.
    * `ASSIGN_GLOBAL_PERMISSIONS`: Permite conceder o revocar permisos directos.
    * `CREATE_EVALUATIONS`: Permite iniciar y guardar evaluaciones.
    * `EDIT_EVALUATIONS`: Permite modificar borradores o evaluaciones.
    * `DELETE_EVALUATIONS`: Permite eliminar evaluaciones.
    * `VIEW_REPORTS`: Permite consultar reportes generales y analíticas.
    * `MANAGE_SYSTEM`: Permite administrar configuraciones del sistema y eliminar proyectos.
* **Middleware de Autorización en Backend**:
  * Dependencias en FastAPI que validan la autenticidad y vigencia del JWT en cada petición.
  * Verificación estricta del estado activo del usuario.
  * Validación a nivel de controlador del permiso exacto requerido.
  * **Superusuario (ADMIN Bypass)**: Los usuarios que poseen el rol `ADMIN` sobrepasan automáticamente cualquier verificación de permisos, garantizando un control total del sistema.
* **Restricciones de Interfaz (Frontend Guards)**:
  * Helper `authService.can(permission)` que evalúa los privilegios del usuario logueado.
  * Oculta o deshabilita elementos visuales interactivos (como botones de creación, pestañas administrativas o acciones de borrado) si el usuario no cuenta con el permiso requerido.

---

## 3. Módulo de Gestión y Administración de Usuarios

Pantalla de control administrativo para la supervisión y mantenimiento de los usuarios de la plataforma.

* **Directorio General de Usuarios**:
  * Tabla interactiva que presenta todos los usuarios registrados en el sistema.
  * Muestra metadatos detallados: Iniciales del usuario, Nombre completo, Correo electrónico, Rol del sistema (representado por insignias de colores según jerarquía), Estado actual (`ACTIVO` / `INACTIVO`) y Fecha de registro.
  * Buscador en tiempo real integrado que filtra instantáneamente por nombre o correo electrónico.
* **Creación de Usuarios por Administradores**:
  * Formulario en modal interactivo que permite a un administrador dar de alta a un nuevo miembro del equipo, asignándole Nombre, Correo, Contraseña inicial y un Rol (`ADMIN` o `EVALUADOR`).
* **Activación y Desactivación de Cuentas**:
  * Control deslizante de estado interactivo que actualiza en tiempo real el campo de actividad del usuario en la base de datos.
  * **Restricción de Seguridad Crítica**: Se prohíbe la desactivación del último administrador activo para evitar bloqueos del sistema.
* **Eliminación Física de Usuarios**:
  * Acción de borrado definitivo protegida por confirmación interactiva.
  * **Restricción de Seguridad Crítica**: Se prohíbe la eliminación física del último administrador registrado en el sistema.
* **Asignación de Roles del Sistema**:
  * Posibilidad de actualizar el rol del usuario directamente.
  * **Restricción de Seguridad Crítica**: Se prohíbe la revocación del rol `ADMIN` al último administrador del sistema.

---

## 4. Módulo de Permisos Globales y Asignación Directa

Permite ajustar con precisión milimétrica los accesos de cualquier usuario, independientemente del rol base que posea.

* **Buscador y Selector de Usuarios**:
  * Panel lateral con buscador interactivo y tarjetas de usuario dinámicas para facilitar la navegación y selección del miembro a configurar.
* **Checklist Interactiva de Permisos Directos**:
  * Desglose completo de los 11 permisos del sistema con sus respectivos nombres legibles y descripciones técnicas de su alcance.
  * **Identificación Visual de Permisos Heredados**: Los permisos que el usuario ya tiene concedidos por su rol se marcan visualmente con una insignia **"Desde Rol"** y se deshabilitan. Esto evita la redundancia y clarifica el origen del privilegio.
  * Guardado asíncrono persistente al backend de los permisos directos seleccionados mediante el botón "Guardar Cambios".

---

## 5. Directorio de Roles del Sistema

* **Visualizador de Roles Base**:
  * Tarjetas de presentación de los dos roles fundamentales de la plataforma: `ADMIN` y `EVALUADOR`.
  * Detalle descriptivo de las responsabilidades asociadas a cada rol.
  * Indicador numérico del total de permisos base preconfigurados para cada rol.
  * Mensaje de seguridad que aclara que estos roles son estructurales y no alterables directamente para garantizar la integridad y estabilidad del sistema.

---

## 6. Módulo de Gestión de Proyectos

Los proyectos actúan como contenedores o espacios de trabajo para las evaluaciones heurísticas.

* **Listado de Proyectos**:
  * Directorio visual de todos los proyectos creados por el usuario o asignados a él.
  * Filtrado automático en la API para garantizar la privacidad y el aislamiento de los datos entre diferentes usuarios.
* **Creación de Nuevos Proyectos**:
  * Formulario en modal interactivo para definir un nuevo espacio de trabajo proporcionando: Nombre del Proyecto, Cliente / Empresa asociada y una breve Descripción del alcance.
* **Dashboard Detallado del Proyecto**:
  * Encabezado interactivo con el nombre del proyecto, descripción completa, cliente e información de fecha de creación.
  * **Seguimiento del Progreso del Proyecto**: Indicador estadístico que compara el número de evaluaciones realizadas frente a un objetivo base del proyecto (10 evaluaciones) mediante una barra de progreso visual con sombras difuminadas.
  * **Directorio del Equipo Evaluador**: Mapeo dinámico que extrae a todos los evaluadores que han realizado alguna prueba en este proyecto, mostrando sus iniciales, rol y estado.
  * **Malla de Accesos Rápidos**: Enlaces intuitivos a Evaluaciones del Proyecto, Analíticas, Configuración de Categorías y Exportación de Reportes.
* **Eliminación Segura de Proyectos**:
  * Integración con permisos estrictos de backend (`MANAGE_SYSTEM`) para permitir la eliminación completa del proyecto y sus registros relacionados.

---

## 7. Motor de Ejecución de Evaluaciones Heurísticas

* **Catálogo de Plantillas de Evaluación**:
  * Tarjetas dinámicas que muestran las plantillas de usabilidad disponibles en la base de datos (con su respectiva descripción técnica).
  * Flujo de inicio interactivo que requiere seleccionar a qué proyecto pertenecerá la evaluación antes de abrir el formulario dinámico.
* **Formulario Dinámico de Evaluaciones**:
  * Agrupación automatizada de preguntas según la **Dimensión de Usabilidad** a la que pertenecen (ej. Visibilidad del estado del sistema, Consistencia, etc.).
  * Soporte multiidioma técnico: Muestra la redacción de la pregunta en español y una traducción auxiliar en inglés cursiva debajo.
  * **Formatos de Respuestas Soportados**:
    * **Escalas Likert**: Soporta escalas de 5 y 9 puntos con botones circulares interactivos, efectos de iluminación en selección y etiquetas dinámicas.
    * **Opciones Categóricas**: Botones de selección en malla con pesos específicos e identificación de opciones no aplicables (N/A).
  * **Entrada de Comentarios Cualitativos**: Área de texto individualizada para cada pregunta, permitiendo documentar observaciones, hallazgos críticos o capturas.
* **Cálculo y Persistencia Automatizada (Backend)**:
  * El servicio de negocio en backend (`EvaluacionService`):
    * Persiste la cabecera de la evaluación y cada una de las respuestas individuales.
    * Calcula automáticamente la nota promedio de cada dimensión de usabilidad basada en las respuestas cuantitativas.
    * Registra el número de **Advertencias (Warnings)** basándose en puntuaciones bajas (opciones categóricas con valor $\le 1$) para resaltar de forma automática fallas de usabilidad graves.

---

## 8. Módulo de Analíticas y Visualización de Datos (Heuristic Analytics)

Este módulo traduce los datos fríos de las evaluaciones en información visual y útil para la toma de decisiones de diseño.

* **Grid de KPIs y Tarjetas de Métricas**:
  * **Puntaje Medio**: Promedio general obtenido en todas las pruebas.
  * **Alertas Críticas**: Cantidad de warnings activos identificados.
  * **Heurística Top**: Dimensión de usabilidad con la puntuación más destacada.
  * **Bajo Desempeño**: Dimensión con el promedio más bajo y que requiere atención urgente.
* **Visualizaciones Interactivas (Integración con Recharts)**:
  * **Gráfico de Barras (Promedio por Heurística)**: Muestra el desempeño comparativo de cada heurística. Cuenta con coloración dinámica en las barras de acuerdo al score obtenido para facilitar el diagnóstico rápido (Rojo para puntajes deficientes $<3$, Ámbar para puntajes medios $<4$, Púrpura para puntajes excelentes $\ge4$).
  * **Gráfico de Radar (Evaluación Global)**: Gráfica de araña que muestra el nivel de madurez o huella de usabilidad del sistema evaluado a lo largo de las distintas categorías de análisis de forma simultánea.
* **Generación Automática de UX Insights**:
  * Tarjetas de recomendaciones generadas a partir del comportamiento de los datos (ejemplo: llamadas de atención urgentes debido a inconsistencias en flujos críticos, o felicitaciones por alta prevención de errores en validaciones en tiempo real).

---

## 9. Asignación de Evaluadores por Proyecto y Tipo de Evaluación

* **Asignación Administrativa de Evaluadores**:
  * Los administradores pueden entrar a la gestión de equipo de un proyecto y definir qué evaluadores participarán en él.
  * Cada asignación permite registrar un enfoque de trabajo como `UI`, `UX`, `Accesibilidad`, `Contenido` o cualquier etiqueta operativa definida por el administrador.
  * El administrador puede seleccionar qué plantillas o tipos de evaluación puede trabajar cada evaluador dentro de un proyecto.
* **Visibilidad de Proyectos Asignados**:
  * Los evaluadores visualizan tanto los proyectos creados por ellos como los proyectos a los que fueron asignados por un administrador.
  * Los administradores visualizan todos los proyectos para poder supervisar y distribuir el trabajo.
* **Control de Tipos Permitidos**:
  * Al iniciar una evaluación, el sistema valida las asignaciones del proyecto y evita que un evaluador inicie una plantilla que no fue asignada a su enfoque.
  * Si no existen restricciones para el evaluador en un proyecto, puede usar las plantillas disponibles según sus permisos globales.

---

## 10. Persistencia de Progreso y Reanudación de Evaluaciones

* **Borradores de Evaluación**:
  * El formulario de evaluación crea o actualiza automáticamente una evaluación en estado `borrador` mientras el evaluador responde.
  * Las respuestas parciales, opciones seleccionadas y comentarios cualitativos se guardan en la base de datos.
* **Reanudación de Trabajo Incompleto**:
  * La pantalla de evaluaciones del proyecto muestra tanto evaluaciones completadas como borradores.
  * Los borradores muestran porcentaje de avance, cantidad de respuestas guardadas y botón **Continuar** para retomar exactamente desde el último punto guardado.
  * Al finalizar una evaluación en borrador, el backend reutiliza el mismo registro y cambia su estado a `completada`.
* **Corrección del Estado Vacío**:
  * La lista de evaluaciones ya no muestra "No hay evaluaciones registradas" cuando existen borradores o evaluaciones completadas para el proyecto.

---

## 11. Métricas de Recurrencia de Tipos de Evaluación

* **Tipos más recurrentes**:
  * El dashboard calcula las plantillas más usadas a partir de las evaluaciones registradas en los proyectos visibles para el usuario.
  * Se muestran los tipos de evaluación más frecuentes para orientar la distribución de trabajo entre evaluadores.

---

## 12. Preferencias de Tema Visual

* **Alternancia Claro/Oscuro**:
  * El layout principal incluye un control para alternar entre modo oscuro y modo claro.
  * La preferencia se conserva en `localStorage` y se restaura al recargar la aplicación.
  * Si no hay preferencia guardada, el sistema respeta la configuración visual del navegador.

---

## 13. Arquitectura de Software y Base de Datos

* **Backend FastAPI en Arquitectura Limpia/Hexagonal**:
  * Estructuración modular estricta dividida en capas para garantizar la escalabilidad e independencia técnica:
    * `interfaces`: Controladores y enrutadores de la API RESTful.
    * `application`: Servicios y lógica de negocio unificada (ej. cálculos de promedios, reglas RBAC).
    * `domain`: Esquemas de validación y modelos conceptuales de datos (Pydantic).
    * `infrastructure`: Modelos relacionales ORM (SQLAlchemy), conexión a base de datos y repositorios.
* **Modelo Relacional en Base de Datos PostgreSQL**:
  * Mapeo robusto a través de SQLAlchemy ORM con las siguientes tablas en plural:
    * Roles y accesos: `roles`, `permissions`, `user_roles`, `role_permissions`, `user_permissions`.
    * Datos clave: `users`, `proyectos`, `proyectos_usuarios`.
    * Asignaciones operativas: `evaluator_project_assignments`.
    * Estructura heurística: `plantillas`, `dimensiones`, `preguntas`, `opciones_categoricas`, `preguntas_opciones`.
    * Resultados, progreso y métricas: `evaluaciones`, `respuestas`, `evaluation_progress`, `resultados_dimensiones`.
* **Script de Inicialización y Migración (`tablas.sql`)**:
  * Configuración completa de llaves foráneas con borrados en cascada (`ON DELETE CASCADE`), restricciones de unicidad (`UniqueConstraint`), indexación de campos clave para búsquedas optimizadas e inserción automatizada de roles base y datos semilla.
