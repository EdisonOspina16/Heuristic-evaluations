from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from src.infrastructure.database import get_db
from src.infrastructure.models import User
from src.application.services.security import check_permissions

from ...application.services.analytics_service import AnalyticsService
from ...application.services.ai_insights_service import AiInsightsService, GeminiConfigurationError
from ...domain.schemas import ProjectAnalyticsResponse, ProjectSummaryCard, ProjectAiPayload

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


@router.get("/projects/{project_id}/ai-payload", response_model=ProjectAiPayload)
def get_project_ai_payload(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permissions("VIEW_REPORTS")),
):
    """Returns compact project data ready for Gemini."""
    service = AnalyticsService(db)
    result = service.get_project_ai_payload(project_id, current_user)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@router.get("/projects/{project_id}/ai-insights/stream")
def stream_project_ai_insights(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permissions("VIEW_REPORTS")),
):
    """Streams AI insights as Server-Sent Events (SSE)."""
    analytics_service = AnalyticsService(db)
    payload = analytics_service.get_project_ai_payload(project_id, current_user)
    if payload is None:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        insights_service = AiInsightsService()
    except GeminiConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return StreamingResponse(
        insights_service.stream_insights(payload),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
        
