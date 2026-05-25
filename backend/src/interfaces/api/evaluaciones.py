from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...infrastructure.database import get_db
from ...application.services.evaluacion_service import EvaluacionService
from ...domain.schemas import EvaluacionCreate, EvaluacionResponse, ProgressSave, ProgressResponse
from typing import List

router = APIRouter(prefix="/evaluaciones", tags=["evaluaciones"])

@router.post("/", response_model=EvaluacionResponse)
def create_evaluacion(eval_data: EvaluacionCreate, db: Session = Depends(get_db)):
    """
    Recibe un payload con las respuestas de una evaluación heurística,
    lo guarda en la base de datos y calcula los promedios por dimensión.
    """
    service = EvaluacionService(db)
    try:
        return service.registrar_evaluacion(eval_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/proyecto/{project_id}", response_model=List[EvaluacionResponse])
def get_evaluaciones_proyecto(project_id: int, db: Session = Depends(get_db)):
    service = EvaluacionService(db)
    return service.get_evaluaciones_proyecto(project_id)

@router.patch("/progress", response_model=EvaluacionResponse)
def save_progress(progress_data: ProgressSave, db: Session = Depends(get_db)):
    service = EvaluacionService(db)
    try:
        return service.guardar_progreso(progress_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/progress/{evaluation_id}", response_model=ProgressResponse)
def get_progress(evaluation_id: int, db: Session = Depends(get_db)):
    service = EvaluacionService(db)
    progress = service.get_progreso(evaluation_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Evaluation progress not found")
    return progress
