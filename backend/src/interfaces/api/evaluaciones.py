from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...infrastructure.database import get_db
from ...application.services.evaluacion_service import EvaluacionService
from ...domain.schemas import EvaluacionCreate, EvaluacionResponse
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
