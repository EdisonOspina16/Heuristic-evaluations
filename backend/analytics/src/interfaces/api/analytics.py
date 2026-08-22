from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database import get_db
from src.infrastructure.models import User
from src.application.services.security import check_permissions

from ...application.services.analytics_service import AnalyticsService
from ...domain.schemas import ProjectAnalyticsResponse, ProjectSummaryCard

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/projects", response_model=List[ProjectSummaryCard])
def get_projects_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permissions("VIEW_REPORTS")),
):
    service = AnalyticsService(db)
    return service.get_projects_summary(current_user)


@router.get("/projects/{project_id}", response_model=ProjectAnalyticsResponse)
def get_project_analytics(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permissions("VIEW_REPORTS")),
):
    service = AnalyticsService(db)
    result = service.get_project_analytics(project_id, current_user)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result
