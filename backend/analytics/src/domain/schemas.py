from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

"""
Esquemas Pydantic del módulo de analíticas. Definen el contrato de datos
estable que consume el frontend (Analytics Home y Project Dashboard).
"""


class SeverityCounts(BaseModel):
    high: int = 0
    medium: int = 0
    low: int = 0


class ProjectSummaryCard(BaseModel):
    id: int
    nombre: str
    cliente: Optional[str] = None
    descripcion: Optional[str] = None
    has_data: bool
    ux_score: Optional[int] = None
    status: str
    severity: SeverityCounts
    evaluators_count: int
    evaluations_count: int
    last_evaluation_at: Optional[datetime] = None


class HeuristicBreakdown(BaseModel):
    dimension_id: int
    name: str
    average: Optional[float] = None
    high: int = 0
    medium: int = 0
    low: int = 0


class IssueItem(BaseModel):
    id: str
    dimension_id: int
    heuristic_name: str
    severity: str
    description: str
    evaluator_name: str
    evaluation_id: int
    agreement_count: int
    agreement_total: int


class EvaluatorMetric(BaseModel):
    id: int
    name: str
    role: Optional[str] = None
    completed: int
    issues_found: int


class TimelinePoint(BaseModel):
    date: str
    label: str
    average: float


class ProjectAnalyticsSummary(BaseModel):
    ux_score: Optional[int] = None
    status: str
    total_evaluations: int
    completed_evaluations: int
    evaluators_count: int
    total_issues: int
    high_priority_issues: int
    avg_issues_per_evaluator: float


class ProjectInfo(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    cliente: Optional[str] = None


class ProjectAnalyticsResponse(BaseModel):
    project: ProjectInfo
    has_data: bool
    summary: ProjectAnalyticsSummary
    severity_breakdown: SeverityCounts
    heuristics: List[HeuristicBreakdown] = []
    issues: List[IssueItem] = []
    evaluators: List[EvaluatorMetric] = []
    timeline: List[TimelinePoint] = []
