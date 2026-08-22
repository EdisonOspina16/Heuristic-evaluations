-- Migración incremental y no destructiva para bases de datos ya desplegadas
-- (por ejemplo la instancia de Supabase). No usa DROP TABLE; solo agrega la
-- columna y los índices que ya están en init-bd/tablas.sql para instalaciones
-- nuevas. Segura de correr más de una vez (todo es IF NOT EXISTS).

-- 1. Columna para el modelo de "burbujas" de administración: cada usuario
--    guarda qué admin lo creó (NULL si se auto-registró).
ALTER TABLE users ADD COLUMN IF NOT EXISTS creado_por INT REFERENCES users(id) ON DELETE SET NULL;

-- 2. Índices sobre columnas FK (Postgres no las indexa automáticamente).
CREATE INDEX IF NOT EXISTS idx_users_creado_por ON users(creado_por);
CREATE INDEX IF NOT EXISTS idx_proyectos_creado_por ON proyectos(creado_por);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_proyecto_id ON evaluaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_dimensiones_plantilla_id ON dimensiones(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_dimension_id ON preguntas(dimension_id);
CREATE INDEX IF NOT EXISTS idx_evaluator_project_assignments_project_id ON evaluator_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluator_project_assignments_evaluator_id ON evaluator_project_assignments(evaluator_id);
