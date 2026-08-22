export type Severity = "high" | "medium" | "low"

export interface SeverityCounts {
  high: number
  medium: number
  low: number
}

export interface ProjectSummaryCard {
  id: number
  nombre: string
  cliente?: string
  descripcion?: string
  has_data: boolean
  ux_score: number | null
  status: string
  severity: SeverityCounts
  evaluators_count: number
  evaluations_count: number
  last_evaluation_at: string | null
}

export interface HeuristicBreakdown {
  dimension_id: number
  name: string
  average: number | null
  high: number
  medium: number
  low: number
}

export interface IssueItem {
  id: string
  dimension_id: number
  heuristic_name: string
  severity: Severity
  description: string
  evaluator_name: string
  evaluation_id: number
  agreement_count: number
  agreement_total: number
}

export interface EvaluatorMetric {
  id: number
  name: string
  role?: string | null
  completed: number
  issues_found: number
}

export interface TimelinePoint {
  date: string
  label: string
  average: number
}

export interface ProjectAnalyticsSummary {
  ux_score: number | null
  status: string
  total_evaluations: number
  completed_evaluations: number
  evaluators_count: number
  total_issues: number
  high_priority_issues: number
  avg_issues_per_evaluator: number
}

export interface ProjectInfo {
  id: number
  nombre: string
  descripcion?: string
  cliente?: string
}

export interface ProjectAnalyticsResponse {
  project: ProjectInfo
  has_data: boolean
  summary: ProjectAnalyticsSummary
  severity_breakdown: SeverityCounts
  heuristics: HeuristicBreakdown[]
  issues: IssueItem[]
  evaluators: EvaluatorMetric[]
  timeline: TimelinePoint[]
}
