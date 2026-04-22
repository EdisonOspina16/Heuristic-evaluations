from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import date, datetime
from decimal import Decimal

"""
Esquemas Pydantic utilizados para validar el payload de entrada y serializar
la salida en la API. Define estructuras para autenticación, plantillas y evaluaciones.
"""

# --- USUARIO ---
class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: str

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- PROYECTO ---
class ProyectoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    cliente: Optional[str] = None

class ProyectoCreate(ProyectoBase):
    pass

class ProyectoResponse(ProyectoBase):
    id: int
    creado_por: Optional[int]
    created_at: datetime
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
    plantilla_id: int
    proyecto_id: int
    evaluador_id: int
    perfil: Optional[str] = None
    estudios: Optional[str] = None
    respuestas: List[RespuestaCreate]

class EvaluacionResponse(BaseModel):
    id: int
    plantilla_id: int
    proyecto_id: int
    evaluador_id: int
    estado: str
    fecha: date
    created_at: datetime
    class Config:
        from_attributes = True

# --- RESULTADOS ---
class ResultadoDimensionResponse(BaseModel):
    dimension_id: int
    promedio: Decimal
    total_preguntas: int
    respondidas: int
    warnings: int
    class Config:
        from_attributes = True

class EvaluacionDetalle(EvaluacionResponse):
    resultados_dimension: List[ResultadoDimensionResponse] = []
