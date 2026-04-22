from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DECIMAL, Date, TIMESTAMP, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

"""
Contiene los modelos de SQLAlchemy que mapean las tablas de la base de datos:
- Usuario, Proyecto, Plantilla (Entidades base)
- Dimension, Pregunta (Estructura de la evaluación)
- Evaluacion, Respuesta, ResultadoDimension (Datos transaccionales)
"""
from .database import Base

class Usuario(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        CheckConstraint("rol IN ('admin', 'evaluador')", name="check_rol"),
    )

    # Relationships
    proyectos_creados = relationship("Proyecto", back_populates="creador")
    evaluaciones = relationship("Evaluacion", back_populates="evaluador")
    proyectos_asignados = relationship("Proyecto", secondary="proyecto_usuario", back_populates="usuarios_asignados")

class Proyecto(Base):
    __tablename__ = "proyecto"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    cliente = Column(String(255))
    creado_por = Column(Integer, ForeignKey("usuario.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    creador = relationship("Usuario", back_populates="proyectos_creados")
    usuarios_asignados = relationship("Usuario", secondary="proyecto_usuario", back_populates="proyectos_asignados")
    evaluaciones = relationship("Evaluacion", back_populates="proyecto")

class ProyectoUsuario(Base):
    __tablename__ = "proyecto_usuario"

    proyecto_id = Column(Integer, ForeignKey("proyecto.id", ondelete="CASCADE"), primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True)

class Plantilla(Base):
    __tablename__ = "plantilla"

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
    __tablename__ = "dimension"

    id = Column(Integer, primary_key=True, index=True)
    plantilla_id = Column(Integer, ForeignKey("plantilla.id", ondelete="CASCADE"))
    nombre = Column(String(255), nullable=False)
    orden = Column(Integer, nullable=False)

    # Relationships
    plantilla = relationship("Plantilla", back_populates="dimensiones")
    preguntas = relationship("Pregunta", back_populates="dimension", cascade="all, delete-orphan")

class Pregunta(Base):
    __tablename__ = "pregunta"

    id = Column(Integer, primary_key=True, index=True)
    dimension_id = Column(Integer, ForeignKey("dimension.id", ondelete="CASCADE"))
    texto = Column(Text, nullable=False)
    texto_en = Column(Text)
    orden = Column(Integer, nullable=False)
    inversa = Column(Boolean, default=False)
    tipo_respuesta = Column(String(20), nullable=False)

    # Relationships
    dimension = relationship("Dimension", back_populates="preguntas")
    opciones = relationship("OpcionCategorica", secondary="pregunta_opcion", back_populates="preguntas")
    respuestas = relationship("Respuesta", back_populates="pregunta")

class OpcionCategorica(Base):
    __tablename__ = "opcion_categorica"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    etiqueta = Column(String(100), nullable=False)
    valor = Column(Integer, nullable=False)
    es_na = Column(Boolean, default=False)

    # Relationships
    preguntas = relationship("Pregunta", secondary="pregunta_opcion", back_populates="opciones")
    respuestas = relationship("Respuesta", back_populates="opcion")

class PreguntaOpcion(Base):
    __tablename__ = "pregunta_opcion"

    pregunta_id = Column(Integer, ForeignKey("pregunta.id", ondelete="CASCADE"), primary_key=True)
    opcion_id = Column(Integer, ForeignKey("opcion_categorica.id", ondelete="CASCADE"), primary_key=True)

class Evaluacion(Base):
    __tablename__ = "evaluacion"

    id = Column(Integer, primary_key=True, index=True)
    plantilla_id = Column(Integer, ForeignKey("plantilla.id"))
    proyecto_id = Column(Integer, ForeignKey("proyecto.id"))
    evaluador_id = Column(Integer, ForeignKey("usuario.id"))
    perfil = Column(String(100))
    estudios = Column(String(100))
    fecha = Column(Date, server_default=func.current_date())
    estado = Column(String(20), default="borrador")
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    plantilla = relationship("Plantilla", back_populates="evaluaciones")
    proyecto = relationship("Proyecto", back_populates="evaluaciones")
    evaluador = relationship("Usuario", back_populates="evaluaciones")
    respuestas = relationship("Respuesta", back_populates="evaluacion", cascade="all, delete-orphan")
    resultados_dimension = relationship("ResultadoDimension", back_populates="evaluacion", cascade="all, delete-orphan")

class Respuesta(Base):
    __tablename__ = "respuesta"

    id = Column(Integer, primary_key=True, index=True)
    evaluacion_id = Column(Integer, ForeignKey("evaluacion.id", ondelete="CASCADE"))
    pregunta_id = Column(Integer, ForeignKey("pregunta.id"))
    valor_numerico = Column(DECIMAL(4, 2))
    opcion_id = Column(Integer, ForeignKey("opcion_categorica.id"))
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
    __tablename__ = "resultado_dimension"

    id = Column(Integer, primary_key=True, index=True)
    evaluacion_id = Column(Integer, ForeignKey("evaluacion.id", ondelete="CASCADE"))
    dimension_id = Column(Integer, ForeignKey("dimension.id"))
    promedio = Column(DECIMAL(5, 2))
    total_preguntas = Column(Integer)
    respondidas = Column(Integer)
    warnings = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("evaluacion_id", "dimension_id", name="unique_resultado_dimension"),
    )

    # Relationships
    evaluacion = relationship("Evaluacion", back_populates="resultados_dimension")
