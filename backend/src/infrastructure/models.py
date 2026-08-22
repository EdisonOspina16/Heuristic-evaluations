from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DECIMAL, Date, TIMESTAMP, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

"""
Contiene los modelos de SQLAlchemy que mapean las tablas de la base de datos.
Se ha implementado un sistema RBAC (Role-Based Access Control) inspirado en SonarQube.
"""

# --- RBAC MODELS ---

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))

    # Relationships
    users = relationship("User", secondary="user_roles", back_populates="roles")
    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255))

    # Relationships
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")
    users = relationship("User", secondary="user_permissions", back_populates="direct_permissions")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"))

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"))
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"))

class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"))

# --- CORE MODELS ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    # Admin que creó este usuario (NULL para quien se auto-registró: es raíz de su propia
    # "burbuja" y solo el admin que crea evaluadores/otros admins ve lo que él mismo creó).
    creado_por = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    creador = relationship("User", remote_side=[id], backref="usuarios_creados")
    roles = relationship("Role", secondary="user_roles", back_populates="users")
    direct_permissions = relationship("Permission", secondary="user_permissions", back_populates="users")
    
    proyectos_creados = relationship("Proyecto", back_populates="creador")
    evaluaciones = relationship("Evaluacion", back_populates="evaluador")
    proyectos_asignados = relationship("Proyecto", secondary="proyectos_usuarios", back_populates="evaluadores")

class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    cliente = Column(String(255))
    creado_por = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    creador = relationship("User", back_populates="proyectos_creados")
    evaluadores = relationship("User", secondary="proyectos_usuarios", back_populates="proyectos_asignados")
    evaluaciones = relationship("Evaluacion", back_populates="proyecto")

class ProyectoUsuario(Base):
    __tablename__ = "proyectos_usuarios"

    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), primary_key=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    enfoque = Column(String(50), default="General")

# New model for assigning evaluators to projects with specific evaluation types
class EvaluatorProjectAssignment(Base):
    __tablename__ = "evaluator_project_assignments"

    id = Column(Integer, primary_key=True, index=True)
    evaluator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    # Store allowed evaluation type identifiers (e.g., UI, UX, Accessibility) as a JSON array
    allowed_evaluation_types = Column(Text, nullable=True)  # JSON string list
    role = Column(String(255), default="Evaluator")  # description like frontend, UI, UX, etc.

    evaluator = relationship("User", backref="project_assignments")
    project = relationship("Proyecto", backref="evaluator_assignments")

# New model for persisting partial evaluation progress
class EvaluationProgress(Base):
    __tablename__ = "evaluation_progress"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluaciones.id", ondelete="CASCADE"), nullable=False)
    heuristic_id = Column(Integer, ForeignKey("preguntas.id", ondelete="CASCADE"), nullable=True)
    status = Column(String(20), default="incomplete")  # e.g., incomplete, completed
    saved_state = Column(Text, nullable=True)  # JSON representation of partial answers
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    evaluation = relationship("Evaluacion", backref="progress_entries")
    question = relationship("Pregunta", backref="progress_entries")

class Plantilla(Base):
    __tablename__ = "plantillas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    version = Column(Integer, default=1)
    activa = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    dimensiones = relationship("Dimension", back_populates="plantilla", cascade="all, delete-orphan")
    evaluaciones = relationship("Evaluacion", back_populates="plantilla")

class Dimension(Base):
    __tablename__ = "dimensiones"

    id = Column(Integer, primary_key=True, index=True)
    plantilla_id = Column(Integer, ForeignKey("plantillas.id", ondelete="CASCADE"), index=True)
    nombre = Column(String(255), nullable=False)
    orden = Column(Integer, nullable=False)

    # Relationships
    plantilla = relationship("Plantilla", back_populates="dimensiones")
    preguntas = relationship("Pregunta", back_populates="dimension", cascade="all, delete-orphan")

class Pregunta(Base):
    __tablename__ = "preguntas"

    id = Column(Integer, primary_key=True, index=True)
    dimension_id = Column(Integer, ForeignKey("dimensiones.id", ondelete="CASCADE"), index=True)
    texto = Column(Text, nullable=False)
    texto_en = Column(Text)
    orden = Column(Integer, nullable=False)
    inversa = Column(Boolean, default=False)
    tipo_respuesta = Column(String(20), nullable=False)

    # Relationships
    dimension = relationship("Dimension", back_populates="preguntas")
    opciones = relationship("OpcionCategorica", secondary="preguntas_opciones", back_populates="preguntas")
    respuestas = relationship("Respuesta", back_populates="pregunta")

class OpcionCategorica(Base):
    __tablename__ = "opciones_categoricas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    etiqueta = Column(String(100), nullable=False)
    valor = Column(Integer, nullable=False)
    es_na = Column(Boolean, default=False)

    # Relationships
    preguntas = relationship("Pregunta", secondary="preguntas_opciones", back_populates="opciones")
    respuestas = relationship("Respuesta", back_populates="opcion")

class PreguntaOpcion(Base):
    __tablename__ = "preguntas_opciones"

    pregunta_id = Column(Integer, ForeignKey("preguntas.id", ondelete="CASCADE"), primary_key=True)
    opcion_id = Column(Integer, ForeignKey("opciones_categoricas.id", ondelete="CASCADE"), primary_key=True)

class Evaluacion(Base):
    __tablename__ = "evaluaciones"

    id = Column(Integer, primary_key=True, index=True)
    plantilla_id = Column(Integer, ForeignKey("plantillas.id"))
    proyecto_id = Column(Integer, ForeignKey("proyectos.id"), index=True)
    evaluador_id = Column(Integer, ForeignKey("users.id"))
    perfil = Column(String(100))
    estudios = Column(String(100))
    fecha = Column(Date, server_default=func.current_date())
    estado = Column(String(20), default="borrador")
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    plantilla = relationship("Plantilla", back_populates="evaluaciones")
    proyecto = relationship("Proyecto", back_populates="evaluaciones")
    evaluador = relationship("User", back_populates="evaluaciones")
    respuestas = relationship("Respuesta", back_populates="evaluacion", cascade="all, delete-orphan")
    resultados_dimension = relationship("ResultadoDimension", back_populates="evaluacion", cascade="all, delete-orphan")

    @property
    def plantilla_nombre(self):
        return self.plantilla.nombre if self.plantilla else "Evaluación Heurística"

    @property
    def evaluador_nombre(self):
        return self.evaluador.nombre if self.evaluador else "Evaluador"

    @property
    def total_questions(self):
        if not self.plantilla:
            return 0
        return sum(len(dimension.preguntas) for dimension in self.plantilla.dimensiones)

    @property
    def answered_count(self):
        return len([
            respuesta for respuesta in self.respuestas
            if respuesta.valor_numerico is not None or respuesta.opcion_id is not None or (respuesta.comentario or "").strip()
        ])

    @property
    def progress_percentage(self):
        total = self.total_questions
        if total == 0:
            return 0
        return min(100, round((self.answered_count / total) * 100))

class Respuesta(Base):
    __tablename__ = "respuestas"

    id = Column(Integer, primary_key=True, index=True)
    evaluacion_id = Column(Integer, ForeignKey("evaluaciones.id", ondelete="CASCADE"))
    pregunta_id = Column(Integer, ForeignKey("preguntas.id"))
    valor_numerico = Column(DECIMAL(4, 2))
    opcion_id = Column(Integer, ForeignKey("opciones_categoricas.id"))
    comentario = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("evaluacion_id", "pregunta_id", name="unique_respuesta_evaluacion"),
    )

    # Relationships
    evaluacion = relationship("Evaluacion", back_populates="respuestas")
    pregunta = relationship("Pregunta", back_populates="respuestas")
    opcion = relationship("OpcionCategorica", back_populates="respuestas")

class ResultadoDimension(Base):
    __tablename__ = "resultados_dimensiones"

    id = Column(Integer, primary_key=True, index=True)
    evaluacion_id = Column(Integer, ForeignKey("evaluaciones.id", ondelete="CASCADE"))
    dimension_id = Column(Integer, ForeignKey("dimensiones.id"))
    promedio = Column(DECIMAL(5, 2))
    total_preguntas = Column(Integer)
    respondidas = Column(Integer)
    warnings = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("evaluacion_id", "dimension_id", name="unique_resultado_dimension"),
    )

    # Relationships
    evaluacion = relationship("Evaluacion", back_populates="resultados_dimension")
