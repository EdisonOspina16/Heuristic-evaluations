from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import date, datetime
from decimal import Decimal

"""
Esquemas Pydantic utilizados para validar el payload de entrada y serializar
la salida en la API. Define estructuras para autenticación, proyectos, plantillas y evaluaciones.
"""

# --- RBAC ---
class PermissionResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[PermissionResponse] = []
    class Config:
        from_attributes = True

# --- USUARIO ---
class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    active: bool = True

class UsuarioCreate(UsuarioBase):
    nombre: str
    email: EmailStr
    password: str
    # rol is assigned by repository logic or by an admin

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    created_at: datetime
    roles: List[RoleResponse] = []
    direct_permissions: List[PermissionResponse] = []
    class Config:
        from_attributes = True

# --- PROYECTO ---
class ProyectoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    cliente: Optional[str] = None

class ProyectoCreate(ProyectoBase):
    evaluadores_ids: List[int] = []

class ProyectoResponse(ProyectoBase):
    id: int
    creado_por: Optional[int]
    created_at: datetime
    evaluadores: List[UsuarioResponse] = []
    class Config:
        from_attributes = True

# --- PLANTILLA ESTRUCTURA ---
class OpcionResponse(BaseModel):
    id: int
    codigo: str
    etiqueta: str
    valor: int
    class Config:
        from_attributes = True

class PreguntaResponse(BaseModel):
    id: int
    texto: str
    texto_en: Optional[str] = None
    orden: int
    tipo_respuesta: str
    opciones: List[OpcionResponse] = []
    class Config:
        from_attributes = True

class DimensionResponse(BaseModel):
    id: int
    nombre: str
    orden: int
    preguntas: List[PreguntaResponse] = []
    class Config:
        from_attributes = True

class PlantillaBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None

class PlantillaResponse(PlantillaBase):
    id: int
    version: int
    activa: bool
    class Config:
        from_attributes = True

class PlantillaEstructura(PlantillaResponse):
    dimensiones: List[DimensionResponse] = []

# --- EVALUACION ---
class RespuestaCreate(BaseModel):
    pregunta_id: int
    valor_numerico: Optional[Decimal] = None
    opcion_id: Optional[int] = None
    comentario: Optional[str] = None

class EvaluacionCreate(BaseModel):
    evaluation_id: Optional[int] = None
    plantilla_id: int
    proyecto_id: int
    evaluador_id: int
    perfil: Optional[str] = None
    estudios: Optional[str] = None
    respuestas: List[RespuestaCreate]

# --- ASSIGNMENT (ADMIN) ---
class AssignmentCreate(BaseModel):
    evaluator_id: int
    project_id: int
    allowed_evaluation_types: Optional[List[str]] = None  # e.g., ["UI", "UX"]
    role: Optional[str] = "Evaluator"

class AssignmentResponse(BaseModel):
    id: int
    evaluator_id: int
    project_id: int
    allowed_evaluation_types: Optional[List[str]] = None
    role: str
    class Config:
        from_attributes = True

# --- PROGRESS (EVALUATION) ---
class ProgressSave(BaseModel):
    evaluation_id: Optional[int] = None
    plantilla_id: int
    proyecto_id: int
    evaluador_id: int
    respuestas: List[RespuestaCreate] = []
    heuristic_id: Optional[int] = None
    saved_state: Optional[Any] = None
    status: Optional[str] = "incomplete"

class ProgressResponse(BaseModel):
    evaluation_id: int
    plantilla_id: int
    proyecto_id: int
    evaluador_id: int
    estado: str
    progress_percentage: int = 0
    answered_count: int = 0
    total_questions: int = 0
    respuestas: List[RespuestaCreate] = []
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ProgressEntryResponse(BaseModel):
    id: int
    evaluation_id: int
    heuristic_id: int
    saved_state: Optional[Any] = None
    status: str
    class Config:
        from_attributes = True

class ResultadoDimensionResponse(BaseModel):
    dimension_id: int
    promedio: Decimal
    total_preguntas: int
    respondidas: int
    warnings: int
    class Config:
        from_attributes = True


class EvaluacionResponse(BaseModel):
    id: int
    plantilla_id: int
    proyecto_id: int
    evaluador_id: int
    estado: str
    fecha: date
    created_at: datetime
    plantilla_nombre: Optional[str] = None
    evaluador_nombre: Optional[str] = None
    perfil: Optional[str] = None
    estudios: Optional[str] = None
    progress_percentage: int = 0
    answered_count: int = 0
    total_questions: int = 0
    resultados_dimension: List[ResultadoDimensionResponse] = []
    class Config:
        from_attributes = True

class EvaluacionDetalle(EvaluacionResponse):
    pass
