from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...infrastructure.database import get_db
from ...infrastructure.repositories.plantilla_repository import PlantillaRepository
from ...domain.schemas import PlantillaResponse, PlantillaEstructura
from typing import List

router = APIRouter(prefix="/plantillas", tags=["plantillas"])

@router.get("/", response_model=List[PlantillaResponse])
def get_plantillas(db: Session = Depends(get_db)):
    """
    Retorna la lista de todas las plantillas de evaluación disponibles, 
    incluyendo sus dimensiones y preguntas.
    """
    repo = PlantillaRepository(db)
    return repo.get_all_active()

@router.get("/{id}/estructura", response_model=PlantillaEstructura)
def get_estructura(id: int, db: Session = Depends(get_db)):
    repo = PlantillaRepository(db)
    plantilla = repo.get_by_id_with_structure(id)
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return plantilla
