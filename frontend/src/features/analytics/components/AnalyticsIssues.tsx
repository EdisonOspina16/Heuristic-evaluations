import { useState } from "react"
import type { ProjectAnalyticsResponse, Severity } from "../types"
import { SEVERITY_COLORS, SEVERITY_LABELS } from "../colors"
import { IssuesList } from "./IssuesList"
import { AnalyticsFilter, AnalyticsPanel } from "./AnalyticsPanel"

export function AnalyticsIssues({ data }: { data: ProjectAnalyticsResponse }) {
  const [filter, setFilter] = useState<Severity | "all">("all")
  const counts = data.severity_breakdown
  const list = filter === "all" ? data.issues : data.issues.filter((issue) => issue.severity === filter)
  const filters: { key: Severity | "all"; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: data.issues.length },
    { key: "high", label: SEVERITY_LABELS.high, count: counts.high },
    { key: "medium", label: SEVERITY_LABELS.medium, count: counts.medium },
    { key: "low", label: SEVERITY_LABELS.low, count: counts.low },
  ]

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {filters.map((item) => (
          <AnalyticsFilter key={item.key} active={filter === item.key} onClick={() => setFilter(item.key)} color={item.key === "all" ? undefined : SEVERITY_COLORS[item.key]}>
            {item.label} <span>{item.count}</span>
          </AnalyticsFilter>
        ))}
      </div>
      <AnalyticsPanel className="p-4"><IssuesList issues={list} emptyLabel="No hay issues para este filtro." /></AnalyticsPanel>
    </div>
  )
}
