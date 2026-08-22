import { IssueItem } from "../types"
import { SEVERITY_COLORS, SEVERITY_LABELS } from "../colors"

export function IssuesList({ issues, emptyLabel = "No hay issues registrados." }: { issues: IssueItem[]; emptyLabel?: string }) {
  if (!issues.length) {
    return <p className="py-6 text-center text-[13px] text-subtle">{emptyLabel}</p>
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div key={issue.id} className="flex gap-3 rounded-lg border border-border-subtle bg-surface-tint p-3">
          <span className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-full" style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-indigo">{issue.heuristic_name}</span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ color: SEVERITY_COLORS[issue.severity], backgroundColor: `${SEVERITY_COLORS[issue.severity]}1a` }}
              >
                {SEVERITY_LABELS[issue.severity]}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-foreground">{issue.description}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-subtle">
              <span>{issue.evaluator_name}</span>
              {issue.agreement_total > 1 && (
                <span>{issue.agreement_count}/{issue.agreement_total} evaluadores de acuerdo</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
