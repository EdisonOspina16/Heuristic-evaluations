from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from ...infrastructure.database import get_db
from ...infrastructure.models import User, ProyectoUsuario, EvaluatorProjectAssignment
from ...infrastructure.repositories.proyecto_repository import ProyectoRepository
from ...domain.schemas import ProyectoCreate, ProyectoResponse, AssignmentCreate
from ...application.services.security import get_current_user, check_permissions

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[ProyectoResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = ProyectoRepository(db)
    if any(role.name == "ADMIN" for role in current_user.roles):
        return repo.get_all()
    return repo.get_by_user(current_user.id)

@router.post("/", response_model=ProyectoResponse)
def create_project(proyecto: ProyectoCreate, db: Session = Depends(get_db), current_user: User = Depends(check_permissions("CREATE_PROJECTS"))):
    repo = ProyectoRepository(db)
    return repo.create(proyecto, current_user.id)

@router.get("/{proyecto_id}", response_model=ProyectoResponse)
def get_project(proyecto_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = ProyectoRepository(db)
    db_proyecto = repo.get_by_id(proyecto_id)
    if not db_proyecto:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_proyecto

@router.post("/{proyecto_id}/assignments")
def upsert_assignment(
    proyecto_id: int,
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permissions("MANAGE_USERS")),
):
    db_project = ProyectoRepository(db).get_by_id(proyecto_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    evaluator = db.query(User).filter(User.id == assignment.evaluator_id).first()
    if not evaluator:
        raise HTTPException(status_code=404, detail="Evaluator not found")

    db_assignment = (
        db.query(EvaluatorProjectAssignment)
        .filter(
            EvaluatorProjectAssignment.project_id == proyecto_id,
            EvaluatorProjectAssignment.evaluator_id == assignment.evaluator_id,
        )
        .first()
    )
    if not db_assignment:
        db_assignment = EvaluatorProjectAssignment(
            project_id=proyecto_id,
            evaluator_id=assignment.evaluator_id,
        )
        db.add(db_assignment)

    db_assignment.allowed_evaluation_types = json.dumps(assignment.allowed_evaluation_types or [])
    db_assignment.role = assignment.role or "General"

    exists = (
        db.query(ProyectoUsuario)
        .filter(
            ProyectoUsuario.proyecto_id == proyecto_id,
            ProyectoUsuario.usuario_id == assignment.evaluator_id,
        )
        .first()
    )
    if not exists:
        db.add(ProyectoUsuario(
            proyecto_id=proyecto_id,
            usuario_id=assignment.evaluator_id,
            enfoque=db_assignment.role,
        ))
    else:
        exists.enfoque = db_assignment.role

    db.commit()
    db.refresh(db_assignment)
    return {
        "id": db_assignment.id,
        "evaluator_id": db_assignment.evaluator_id,
        "project_id": db_assignment.project_id,
        "allowed_evaluation_types": json.loads(db_assignment.allowed_evaluation_types or "[]"),
        "role": db_assignment.role,
    }

@router.get("/{proyecto_id}/assignments")
def list_assignments(
    proyecto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignments = (
        db.query(EvaluatorProjectAssignment)
        .filter(EvaluatorProjectAssignment.project_id == proyecto_id)
        .all()
    )
    return [
        {
            "id": item.id,
            "evaluator_id": item.evaluator_id,
            "evaluator_name": item.evaluator.nombre if item.evaluator else "Evaluador",
            "evaluator_email": item.evaluator.email if item.evaluator else "",
            "project_id": item.project_id,
            "allowed_evaluation_types": json.loads(item.allowed_evaluation_types or "[]"),
            "role": item.role,
        }
        for item in assignments
    ]

@router.delete("/{proyecto_id}")
def delete_project(proyecto_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_permissions("MANAGE_SYSTEM"))):
    repo = ProyectoRepository(db)
    if not repo.delete(proyecto_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}
