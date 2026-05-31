-- ==========================================
-- 1. EXTENSIONES Y LIMPIEZA
-- ==========================================
-- DROP TABLE IF EXISTS resultados_dimensiones CASCADE;
-- DROP TABLE IF EXISTS respuestas CASCADE;
-- DROP TABLE IF EXISTS evaluaciones CASCADE;
-- DROP TABLE IF EXISTS preguntas_opciones CASCADE;
-- DROP TABLE IF EXISTS opciones_categoricas CASCADE;
-- DROP TABLE IF EXISTS preguntas CASCADE;
-- DROP TABLE IF EXISTS dimensiones CASCADE;
-- DROP TABLE IF EXISTS plantillas CASCADE;
-- DROP TABLE IF EXISTS proyectos_usuarios CASCADE;
-- DROP TABLE IF EXISTS proyectos CASCADE;
-- DROP TABLE IF EXISTS user_permissions CASCADE;
-- DROP TABLE IF EXISTS role_permissions CASCADE;
-- DROP TABLE IF EXISTS user_roles CASCADE;
-- DROP TABLE IF EXISTS permissions CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- 2. RBAC (Roles y Permisos)
-- ==========================================

CREATE TABLE roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE permissions (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE role_permissions (
  id            SERIAL PRIMARY KEY,
  role_id       INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. USUARIOS
-- ==========================================

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_roles (
  id      SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE user_permissions (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. PROYECTOS
-- ==========================================

CREATE TABLE proyectos (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(255) NOT NULL,
  descripcion   TEXT,
  cliente       VARCHAR(255),
  creado_por    INT REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Relación N:M entre Usuarios (Evaluadores) y Proyectos
CREATE TABLE proyectos_usuarios (
  proyecto_id INT REFERENCES proyectos(id) ON DELETE CASCADE,
  usuario_id  INT REFERENCES users(id) ON DELETE CASCADE,
  enfoque      VARCHAR(50) DEFAULT 'General',
  PRIMARY KEY (proyecto_id, usuario_id)
);

CREATE TABLE evaluator_project_assignments (
  id SERIAL PRIMARY KEY,
  evaluator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  allowed_evaluation_types TEXT,
  role VARCHAR(255) DEFAULT 'General',
  UNIQUE (evaluator_id, project_id)
);

-- ==========================================
-- 5. DEFINICIÓN DE PLANTILLAS Y PREGUNTAS
-- ==========================================

CREATE TABLE plantillas (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT,
  version     INT DEFAULT 1,
  activa      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dimensiones (
  id          SERIAL PRIMARY KEY,
  plantilla_id INT REFERENCES plantillas(id) ON DELETE CASCADE,
  nombre      VARCHAR(255) NOT NULL,
  orden       INT NOT NULL
);

CREATE TABLE preguntas (
  id           SERIAL PRIMARY KEY,
  dimension_id INT REFERENCES dimensiones(id) ON DELETE CASCADE,
  texto        TEXT NOT NULL,
  texto_en     TEXT,
  orden        INT NOT NULL,
  inversa      BOOLEAN DEFAULT FALSE,
  tipo_respuesta VARCHAR(20) NOT NULL
);

CREATE TABLE opciones_categoricas (
  id       SERIAL PRIMARY KEY,
  codigo   VARCHAR(20) UNIQUE NOT NULL,
  etiqueta VARCHAR(100) NOT NULL,
  valor    INT NOT NULL,
  es_na    BOOLEAN DEFAULT FALSE
);

CREATE TABLE preguntas_opciones (
  pregunta_id INT REFERENCES preguntas(id) ON DELETE CASCADE,
  opcion_id   INT REFERENCES opciones_categoricas(id) ON DELETE CASCADE,
  PRIMARY KEY (pregunta_id, opcion_id)
);

-- ==========================================
-- 6. EVALUACIONES Y RESPUESTAS
-- ==========================================

CREATE TABLE evaluaciones (
  id            SERIAL PRIMARY KEY,
  plantilla_id  INT REFERENCES plantillas(id),
  proyecto_id   INT REFERENCES proyectos(id),
  evaluador_id  INT REFERENCES users(id),
  perfil        VARCHAR(100),
  estudios      VARCHAR(100),
  fecha         DATE DEFAULT CURRENT_DATE,
  estado        VARCHAR(20) DEFAULT 'borrador',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE respuestas (
  id              SERIAL PRIMARY KEY,
  evaluacion_id   INT REFERENCES evaluaciones(id) ON DELETE CASCADE,
  pregunta_id     INT REFERENCES preguntas(id),
  valor_numerico  DECIMAL(4,2),
  opcion_id       INT REFERENCES opciones_categoricas(id),
  comentario      TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE (evaluacion_id, pregunta_id)
);

CREATE TABLE resultados_dimensiones (
  id            SERIAL PRIMARY KEY,
  evaluacion_id INT REFERENCES evaluaciones(id) ON DELETE CASCADE,
  dimension_id  INT REFERENCES dimensiones(id),
  promedio      DECIMAL(5,2),
  total_preguntas INT,
  respondidas   INT,
  warnings      INT DEFAULT 0,
  UNIQUE (evaluacion_id, dimension_id)
);

CREATE TABLE evaluation_progress (
  id SERIAL PRIMARY KEY,
  evaluation_id INT NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  heuristic_id INT REFERENCES preguntas(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'incomplete',
  saved_state TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 7. SEED DATA - RBAC
-- ==========================================

INSERT INTO roles (name, description) VALUES
('ADMIN', 'Administrador con control total del sistema'),
('EVALUADOR', 'Evaluador con acceso a dashboard y evaluaciones');

INSERT INTO permissions (code, name, description) VALUES
('MANAGE_USERS', 'Gestionar usuarios', 'Ver lista de usuarios'),
('CREATE_USERS', 'Crear usuarios', 'Crear nuevos usuarios en el sistema'),
('EDIT_USERS', 'Editar usuarios', 'Modificar datos de usuarios existentes'),
('DELETE_USERS', 'Eliminar usuarios', 'Eliminar usuarios del sistema'),
('ASSIGN_ROLES', 'Asignar roles', 'Asignar o cambiar roles a usuarios'),
('ASSIGN_GLOBAL_PERMISSIONS', 'Asignar permisos globales', 'Asignar permisos específicos a usuarios'),
('CREATE_EVALUATIONS', 'Crear evaluaciones', 'Iniciar nuevas evaluaciones heurísticas'),
('EDIT_EVALUATIONS', 'Editar evaluaciones', 'Modificar evaluaciones en borrador'),
('DELETE_EVALUATIONS', 'Eliminar evaluaciones', 'Eliminar registros de evaluaciones'),
('VIEW_REPORTS', 'Ver reportes', 'Consultar y descargar reportes de resultados'),
('CREATE_PROJECTS', 'Crear proyectos', 'Permite iniciar nuevos proyectos de evaluación'),
('EDIT_PROJECTS', 'Editar proyectos', 'Modificar datos de proyectos existentes'),
('DELETE_PROJECTS', 'Eliminar proyectos', 'Eliminar proyectos del sistema'),
('MANAGE_SYSTEM', 'Administrar sistema', 'Acceder a configuraciones generales');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.name = 'EVALUADOR' 
AND p.code IN ('CREATE_EVALUATIONS', 'EDIT_EVALUATIONS', 'VIEW_REPORTS', 'CREATE_PROJECTS');

-- ==========================================
-- 8. SEED DATA - PLANTILLAS
-- ==========================================

INSERT INTO plantillas (codigo, nombre, descripcion) VALUES
('QUIM',      'Quality in Use Integrated Measurement', 'Mide eficiencia, eficacia, satisfacción, aprendizaje, memorabilidad, seguridad, flexibilidad y accesibilidad.'),
('SUMI',      'Software Usability Measurement Inventory', 'Cuestionario estándar de 50 ítems para medir usabilidad de software.'),
('SAM',       'Self-Assessment Manikin', 'Mide respuesta emocional: valencia, activación y dominancia en escala 1–9.'),
('UES',       'User Engagement Scale', 'Mide engagement del usuario: atractivo estético, usabilidad percibida, atención, implicación, valor y durabilidad.'),
('HEURISTICA','Evaluación Heurística Nielsen + Tognazzini', 'Evaluación experta basada en 15 principios heurísticos de usabilidad.');

-- ==========================================
-- 9. SEED DATA - DIMENSIONES
-- ==========================================

-- QUIM (ID: 1)
INSERT INTO dimensiones (plantilla_id, nombre, orden) VALUES
(1, 'Eficiencia',     1), (1, 'Eficacia',       2), (1, 'Satisfacción',   3),
(1, 'Aprendizaje',    4), (1, 'Memorabilidad',  5), (1, 'Seguridad',      6),
(1, 'Flexibilidad',   7), (1, 'Errores',        8), (1, 'Accesibilidad',  9);

-- SUMI (ID: 2)
INSERT INTO dimensiones (plantilla_id, nombre, orden) VALUES
(2, 'Eficiencia',    1), (2, 'Afecto',        2), (2, 'Ayuda/Control', 3);

-- SAM (ID: 3)
INSERT INTO dimensiones (plantilla_id, nombre, orden) VALUES
(3, 'Valencia (Placer/Disgusto)',       1),
(3, 'Arousal (Excitación/Calma)',       2),
(3, 'Dominancia (Sentido de Control)', 3);

-- UES (ID: 4)
INSERT INTO dimensiones (plantilla_id, nombre, orden) VALUES
(4, 'Aesthetic Appeal',   1), (4, 'Perceived Usability',2),
(4, 'Focused Attention',  3), (4, 'Felt Involvement',   4),
(4, 'Perceived Value',    5), (4, 'Endurability',       6);

-- HEURISTICA (ID: 5)
INSERT INTO dimensiones (plantilla_id, nombre, orden) VALUES
(5, 'Visibilidad y estado del sistema',                        1),
(5, 'Conexión entre el sistema y el mundo real',               2),
(5, 'Control y libertad del usuario',                          3),
(5, 'Consistencia y estándares',                               4),
(5, 'Reconocimiento en lugar de memoria',                      5),
(5, 'Flexibilidad y eficiencia de uso',                        6),
(5, 'Ayuda a reconocer, diagnosticar y recuperarse de errores',7),
(5, 'Prevención de errores',                                   8),
(5, 'Diseño estético y minimalista',                           9),
(5, 'Ayuda y documentación',                                  10),
(5, 'Guardar el estado y proteger el trabajo',                 11),
(5, 'Color y legibilidad',                                     12),
(5, 'Autonomía',                                              13),
(5, 'Valores por defecto',                                    14),
(5, 'Reducción de la latencia',                               15);

-- ==========================================
-- 10. SEED DATA - PREGUNTAS
-- ==========================================

-- QUIM
INSERT INTO preguntas (dimension_id, texto, orden, tipo_respuesta) VALUES
(1, 'El sistema permite completar tareas de manera rápida y eficiente.', 1, 'likert_5'),
(1, 'El tiempo de respuesta del software es adecuado.', 2, 'likert_5'),
(1, 'La navegación a través del software es fluida y sin interrupciones.', 3, 'likert_5'),
(1, 'El software minimiza la cantidad de pasos necesarios para completar una tarea.', 4, 'likert_5'),
(2, 'El software permite lograr los objetivos propuestos sin dificultades.', 1, 'likert_5'),
(2, 'Las funciones del software cumplen con mis expectativas.', 2, 'likert_5'),
(2, 'Los resultados obtenidos con el software son precisos y confiables.', 3, 'likert_5'),
(3, 'Disfruto utilizando este software.', 1, 'likert_5'),
(3, 'Me siento cómodo y seguro al usar este software.', 2, 'likert_5'),
(3, 'La apariencia visual del software es atractiva.', 3, 'likert_5'),
(3, 'Recomendaría este software a otras personas.', 4, 'likert_5'),
(4, 'Es fácil aprender a usar este software.', 1, 'likert_5'),
(4, 'Las instrucciones y mensajes del sistema son claros.', 2, 'likert_5'),
(4, 'No necesito capacitación extensa para usar este software.', 3, 'likert_5'),
(4, 'Puedo recordar cómo usar el software después de no utilizarlo por un tiempo.', 4, 'likert_5'),
(5, 'Después de un tiempo sin usarlo, puedo recordar fácilmente cómo operar el software.', 1, 'likert_5'),
(5, 'Los atajos y accesos directos son fáciles de recordar.', 2, 'likert_5'),
(6, 'El software protege mis datos and privacidad de manera efectiva.', 1, 'likert_5'),
(6, 'Siento confianza en la seguridad del sistema.', 2, 'likert_5'),
(6, 'El software tiene medidas para evitar errores críticos.', 3, 'likert_5'),
(7, 'Puedo personalizar el software según mis necesidades.', 1, 'likert_5'),
(7, 'El software se adapta a diferentes dispositivos sin problemas.', 2, 'likert_5'),
(7, 'El software permite múltiples métodos para realizar una tarea.', 3, 'likert_5'),
(8, 'Los mensajes de error del software son claros y útiles.', 1, 'likert_5'),
(8, 'El software evita que cometa errores fácilmente.', 2, 'likert_5'),
(8, 'Cuando cometo un error, el software me ayuda a corregirlo rápidamente.', 3, 'likert_5'),
(9, 'El software es accesible para personas con discapacidades.', 1, 'likert_5'),
(9, 'El software proporciona opciones de accesibilidad como ajuste de tamaño de texto y contraste.', 2, 'likert_5'),
(9, 'El software cumple con estándares de accesibilidad.', 3, 'likert_5');

-- SAM (ID: 10, 11, 12)
INSERT INTO preguntas (dimension_id, texto, orden, tipo_respuesta) VALUES
(13, '¿Qué tan placentera fue la experiencia con el software?', 1, 'likert_9'),
(13, '¿Te sentiste feliz o molesto mientras usabas el software?', 2, 'likert_9'),
(13, '¿El software te generó una sensación positiva o negativa?', 3, 'likert_9'),
(14, '¿Te sentiste emocionado o aburrido al usar el software?', 1, 'likert_9'),
(14, '¿El software mantuvo tu interés o lo perdiste rápidamente?', 2, 'likert_9'),
(14, '¿Tuviste una reacción emocional fuerte al usar el software?', 3, 'likert_9'),
(15, '¿Sentiste que tenías control sobre la experiencia con el software?', 1, 'likert_9'),
(15, '¿El software respondía como esperabas o te sentiste perdido?', 2, 'likert_9'),
(15, '¿Tuviste que adaptarte al software o sentiste que era intuitivo?', 3, 'likert_9');

-- UES (ID: 13-18)
INSERT INTO preguntas (dimension_id, texto, orden, tipo_respuesta) VALUES
(16, 'El diseño visual de la interfaz es atractivo.', 1, 'likert_5'),
(16, 'El sistema tiene una apariencia moderna y agradable.', 2, 'likert_5'),
(17, 'El sistema es fácil de usar.', 1, 'likert_5'),
(17, 'No encontré dificultades al interactuar con el sistema.', 2, 'likert_5'),
(17, 'Puedo navegar sin problemas por las diferentes secciones del sistema.', 3, 'likert_5'),
(17, 'No necesito ayuda para entender cómo funciona el sistema.', 4, 'likert_5'),
(18, 'Pierdo la noción del tiempo cuando uso este sistema.', 1, 'likert_5'),
(18, 'Me siento completamente inmerso en la experiencia al usar este sistema.', 2, 'likert_5'),
(18, 'Me cuesta desconectarme del sistema una vez que empiezo a usarlo.', 3, 'likert_5'),
(18, 'Me concentro completamente cuando interactúo con el sistema.', 4, 'likert_5'),
(19, 'Disfruto interactuando con este sistema.', 1, 'likert_5'),
(19, 'Encuentro este sistema interesante y atractivo.', 2, 'likert_5'),
(19, 'Me emociona usar este sistema.', 3, 'likert_5'),
(19, 'Prefiero este sistema en comparación con otros similares.', 4, 'likert_5'),
(20, 'Este sistema es útil para mis necesidades diarias.', 1, 'likert_5'),
(20, 'Siento que este sistema agrega valor a mi trabajo o entretenimiento.', 2, 'likert_5'),
(20, 'Este sistema mejora mi productividad o experiencia general.', 3, 'likert_5'),
(20, 'Considero que el sistema cumple con mis expectativas.', 4, 'likert_5'),
(21, 'Me gustaría seguir usando este sistema en el futuro.', 1, 'likert_5'),
(21, 'Recomendaría este sistema a otras personas.', 2, 'likert_5'),
(21, 'Volvería a usar este sistema aunque existieran alternativas.', 3, 'likert_5'),
(21, 'Me sentiría decepcionado si ya no pudiera usar este sistema.', 4, 'likert_5');

-- HEURISTICA (ID: 19-33)
INSERT INTO preguntas (dimension_id, texto, texto_en, orden, tipo_respuesta) VALUES
(22, '¿La aplicación incluye de forma visible el título de la página, de la sección o del sitio?', 'Does the application include a visible title page, section or site?', 1, 'categorico'),
(22, '¿El usuario sabe en todo momento dónde está?', 'Does the user always know where he is located?', 2, 'categorico'),
(22, '¿El usuario sabe en todo momento qué está haciendo el sistema o aplicación?', 'Does the user always know what the system or application is doing?', 3, 'categorico'),
(22, '¿Los enlaces están claramente definidos?', 'Are the links clearly defined?', 4, 'categorico'),
(22, '¿Todas las acciones pueden verse directamente? (Sin requerir acciones adicionales)', 'Can all actions be visualized directly? (No other actions are required)', 5, 'categorico'),
(23, '¿La información aparece de una manera lógica para el usuario común?', 'Does the information appear in a logical way for the common user?', 1, 'categorico'),
(23, '¿El diseño de los iconos se corresponde con objetos cotidianos?', 'Does the design of the icons correspond to everyday objects?', 2, 'categorico'),
(23, '¿Cada icono realiza la acción que el usuario espera?', 'Each icon performs the action that the user expects?', 3, 'categorico'),
(23, '¿Se utilizan frases y conceptos familiares para el usuario?', 'Are the phrases and concepts used familiar to the user?', 4, 'categorico'),
(24, '¿Existe un vínculo para volver al estado inicial o a la página de inicio?', 'Is there a link to return to the initial state or the home page?', 1, 'categorico'),
(24, '¿Existen funcionalidades para "deshacer" y "rehacer"?', 'Are the functions "undo" and "redo" implemented?', 2, 'categorico'),
(24, '¿Es fácil volver a un estado anterior de la aplicación?', 'Is it easy to return to a previous state of the application?', 3, 'categorico'),
(25, '¿Las etiquetas de los vínculos tienen los mismos nombres que sus destinos?', 'Do the link labels have the same names as their destinations?', 1, 'categorico'),
(25, '¿Las mismas acciones siempre conducen a los mismos resultados?', 'Do the same actions always lead to the same results?', 2, 'categorico'),
(25, '¿Un mismo icono tiene el mismo significado en todo el sistema?', 'Does the same icon have the same meaning throughout the system?', 3, 'categorico'),
(25, '¿La información se muestra de forma consistente en todo el sistema?', 'Is the information consistently displayed throughout the system?', 4, 'categorico'),
(25, '¿Los colores de los enlaces son adecuados para su uso?', 'Are the link colors suitable for use?', 5, 'categorico'),
(25, '¿Los elementos de navegación siguen los estándares? (Botones, checkbox, ...)', 'The navigation elements follow the standards? (Buttons, checkbox, ...)', 6, 'categorico'),
(26, '¿Es sencillo utilizar el sistema por vez primera?', 'Is it easy to use the system for the first time?', 1, 'categorico'),
(26, '¿Es fácil localizar información que ya ha sido buscada con anterioridad?', 'Is it easy to locate information that has already been searched before?', 2, 'categorico'),
(26, '¿En todo momento puedes utilizar el sistema sin necesidad de recordar pantallas anteriores?', 'Can you use the system at any time without having to remember previous screens?', 3, 'categorico'),
(26, '¿Todo el contenido necesario para la navegación está en la "pantalla actual"?', 'Is all the content needed for navigation on the "current screen"?', 4, 'categorico'),
(26, '¿La información está organizada según la lógica de los usuarios a quienes va dirigida?', 'Is the information organized according to the logic of the users to whom the interface is directed?', 5, 'categorico'),
(27, '¿Existen atajos de teclado para las acciones frecuentes?', 'Are there keyboard shortcuts for frequent actions?', 1, 'categorico'),
(27, '¿Si existen, queda claro cómo usarlas?', 'If they exist, is it clear how to use them?', 2, 'categorico'),
(27, '¿Al realizar cualquier acción por primera vez, queda claro cómo realizarla permanentemente?', 'When performing any action for the first time, is it clear how to perform it permanently?', 3, 'categorico'),
(27, '¿El diseño se adapta al cambiar la resolución de la pantalla?', 'Does the design adapt when changing the screen resolution?', 4, 'categorico'),
(27, '¿Es visible el uso de aceleradores para el usuario habitual?', 'Is the use of accelerators visible to the regular user?', 5, 'categorico'),
(27, '¿Se mantiene siempre ocupado al usuario? (Sin tiempos de espera innecesarios)', 'Is the user always busy? (Without unnecessary waiting times)', 6, 'categorico'),
(28, '¿Se muestra un mensaje antes de tomar acciones irreversibles?', 'Is a message displayed before taking irreversible actions?', 1, 'categorico'),
(28, '¿Los errores cometidos se muestran en tiempo real?', 'Are the errors shown in real time?', 2, 'categorico'),
(28, '¿El mensaje de error que aparece es fácilmente interpretable?', 'Is the error message that appears easily interpretable?', 3, 'categorico'),
(28, '¿Se usa, además, algún código para referenciar el error?', 'Is some code also used to reference the error?', 4, 'categorico'),
(29, '¿Aparece un mensaje de confirmación antes de realizar las acciones?', 'Does a confirmation message appear before performing the actions?', 1, 'categorico'),
(29, '¿Queda claro qué hay que introducir en cada campo de un formulario?', 'Is it clear what must be entered in each field of a form?', 2, 'categorico'),
(29, '¿El motor de búsqueda tolera errores tipográficos y ortográficos?', 'Does the search engine tolerate typos and spelling errors?', 3, 'categorico'),
(30, '¿Se ha usado un diseño sin redundancia de información?', 'Has a design without information redundancy been used?', 1, 'categorico'),
(30, '¿La información textual es concisa y precisa?', 'Is the textual information concise and accurate?', 2, 'categorico'),
(30, '¿Cada elemento de información se diferencia del resto y es inconfundible?', 'Each item of information differs from the rest and is unmistakable?', 3, 'categorico'),
(30, '¿La estructuración del texto es correcta, con frases cortas y fácil de interpretar?', 'The structuring of the text is correct, with short sentences and easy to interpret?', 4, 'categorico'),
(31, '¿Existe la opción "ayuda"?', 'Is there a "help" option?', 1, 'categorico'),
(31, '¿En el caso de existir, es visible y de fácil acceso?', 'If it exists, is it visible and easily accessible?', 2, 'categorico'),
(31, '¿La ayuda está orientada a la solución de problemas?', 'Is the help section aimed at solving problems?', 3, 'categorico'),
(31, '¿Dispone de un apartado de preguntas frecuentes?', 'Is there a section of frequently asked questions (FAQ)?', 4, 'categorico'),
(31, '¿La documentación de ayuda es clara, utiliza ejemplos?', 'Is the help documentation clear, uses examples?', 5, 'categorico'),
(32, '¿Los usuarios pueden continuar desde un estado anterior o desde otro dispositivo?', 'Can users continue from a previous state or from another device?', 1, 'categorico'),
(32, '¿Se implementa la utilidad de "autoguardado"?', 'Is the "auto-save" utility implemented?', 2, 'categorico'),
(32, '¿Tiene buena respuesta a fallos ajenos? (Cortes de corriente, de internet, ...)', 'Does the system have a good response to external failures?', 3, 'categorico'),
(33, '¿Las fuentes del texto tienen un tamaño adecuado?', 'Do the text fonts have an appropriate size?', 1, 'categorico'),
(33, '¿Las fuentes del texto utilizan colores con suficiente contraste con el fondo?', 'Do the text fonts use colors with sufficient contrast with the background?', 2, 'categorico'),
(33, '¿El texto con imágenes o patrones de fondo es fácil de leer?', 'Is the text with background images or patterns easy to read?', 3, 'categorico'),
(33, '¿Se tiene en cuenta a los usuarios con visión reducida?', 'Are users with low vision taken into account?', 4, 'categorico'),
(34, '¿Se mantiene en todo momento informado al usuario del estado del sistema?', 'Does it keep the user informed of the system status?', 1, 'categorico'),
(34, '¿El estado del sistema es visible y actualizado?', 'Moreover, is the system status visible and updated?', 2, 'categorico'),
(34, '¿El usuario puede personalizar su espacio personal o de trabajo del sistema?', 'Can the user customize his personal or work space of the system?', 3, 'categorico'),
(35, '¿El sistema proporciona la opción de volver a los valores de fábrica?', 'Does the system or device provide the option to return to factory settings?', 1, 'categorico'),
(35, '¿Si es así, se indican claramente las consecuencias de dicha acción?', 'If so, are the consequences of such action clearly stated?', 2, 'categorico'),
(35, '¿Se utiliza el término "por defecto"?', 'Is the term "default" used?', 3, 'categorico'),
(36, '¿La ejecución de tareas pesadas es transparente al usuario?', 'Is the execution of heavy work transparent to the user?', 1, 'categorico'),
(36, '¿Se muestra el tiempo restante o alguna animación de las tareas pesadas que se están ejecutando?', 'While heavy tasks are being executed, is it showing the remaining time or some animation?', 2, 'categorico');

-- ==========================================
-- 11. SEED DATA - OPCIONES CATEGÓRICAS
-- ==========================================

INSERT INTO opciones_categoricas (codigo, etiqueta, valor, es_na) VALUES
('SI_TODOS',    'Sí, en todos los casos',           3, FALSE),
('SI_ALGUNOS',  'Sí, pero faltan algunos casos',    2, FALSE),
('NO_SIEMPRE',  'No siempre',                       1, FALSE),
('NO_NINGUNO',  'NO, en ningún caso',               0, FALSE),
('NO_APLICA',   'No aplica',                        0, TRUE),
('NO_PROBLEMA', 'NO es un problema',                0, TRUE),
('IMPOSIBLE',   'Imposible de comprobar',           0, TRUE);

-- ==========================================
-- 12. MAPEO PREGUNTAS_OPCIONES (Heurística)
-- ==========================================

INSERT INTO preguntas_opciones (pregunta_id, opcion_id)
SELECT p.id, oc.id
FROM preguntas p
CROSS JOIN opciones_categoricas oc
WHERE p.tipo_respuesta = 'categorico';
