import { HeuristicBarChart } from "./HeuristicBarChart"
import { IssuesList } from "./IssuesList"
import { ScoreRing } from "./ScoreRing"
import { SeverityDonutChart } from "./SeverityDonutChart"
import { TimelineChart } from "./TimelineChart"
import type { ProjectAnalyticsResponse } from "../types"
import { AnalyticsPanel } from "./AnalyticsPanel"

function number(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value)
}

export function AnalyticsOverview({ data }: { data: ProjectAnalyticsResponse }) {
  const priorityIssues = data.issues.slice(0, 6)
  return (
    <div className="space-y-[14px]">
      <section className="grid gap-[14px] xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        <AnalyticsPanel className="flex flex-col items-center gap-5 p-5">
          <ScoreRing score={data.summary.ux_score} status={data.summary.status} />
          <div className="grid w-full grid-cols-2 gap-2">
            {[
              { label: "Total Issues", value: data.summary.total_issues, color: "text-foreground" },
              { label: "Severidad Alta", value: data.summary.high_priority_issues, color: "text-accent-rose" },
              { label: "Evaluadores", value: data.summary.evaluators_count, color: "text-foreground" },
              { label: "Issues/Evaluador", value: number(data.summary.avg_issues_per_evaluator), color: "text-foreground" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-surface-tint p-2.5">
                <p className={`font-mono text-lg ${item.color}`}>{item.value}</p>
                <p className="mt-0.5 text-[10px] text-subtle">{item.label}</p>
              </div>
            ))}
          </div>
        </AnalyticsPanel>
        <AnalyticsPanel className="p-5">
          <h2 className="text-[13px] font-bold text-foreground">Distribución de severidad</h2>
          <p className="mt-1 text-xs text-subtle">Issues detectados en evaluaciones heurísticas</p>
          <SeverityDonutChart severity={data.severity_breakdown} />
        </AnalyticsPanel>
        <AnalyticsPanel className="p-[18px]">
          <h2 className="text-[13px] font-bold text-foreground">Issues prioritarios</h2>
          <p className="mt-1 text-xs text-subtle">Ordenados por severidad y acuerdo entre evaluadores</p>
          <div className="mt-4"><IssuesList issues={priorityIssues} emptyLabel="No hay issues prioritarios registrados." /></div>
        </AnalyticsPanel>
      </section>
      <section className="grid gap-[14px] lg:grid-cols-[minmax(0,1fr)_280px]">
        <AnalyticsPanel className="p-5">
          <h2 className="text-[13px] font-bold text-foreground">Issues por heurística</h2>
          <p className="mt-1 text-xs text-subtle">Severidad acumulada por categoría</p>
          <HeuristicBarChart heuristics={data.heuristics} />
        </AnalyticsPanel>
        <AnalyticsPanel className="p-5">
          <h2 className="text-[13px] font-bold text-foreground">Resultados a lo largo del tiempo</h2>
          <p className="mt-1 text-xs text-subtle">Promedio normalizado (0-100) por evaluación</p>
          <TimelineChart timeline={data.timeline} />
        </AnalyticsPanel>
      </section>
    </div>
  )
}
