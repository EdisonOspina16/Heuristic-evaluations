"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, Loader2 } from "lucide-react"
import { analyticsService } from "@/features/analytics/services/analytics.service"
import { ProjectSummaryCard } from "@/features/analytics/types"
import { STATUS_COLORS } from "@/features/analytics/colors"

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Sin iniciar"
}

export default function AnalyticsPage() {
  const [items, setItems] = useState<ProjectSummaryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        setItems(await analyticsService.getProjectsSummary())
      } catch {
        setError("No se pudieron cargar los proyectos para el análisis.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const withData = items.filter((item) => item.has_data)
  const pending = items.filter((item) => !item.has_data)
  const summary = {
    projects: withData.length,
    evaluations: withData.reduce((total, item) => total + item.evaluations_count, 0),
    alerts: withData.reduce((total, item) => total + item.severity.high + item.severity.medium + item.severity.low, 0),
  }

  return (
    <main className="min-h-full bg-bg-deep px-6 py-8 text-foreground md:px-9 md:py-8">
      <header className="mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">
          <BarChart3 className="h-3.5 w-3.5 text-accent-indigo" /> Analytics
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.025em]">Selecciona un proyecto para analizar</h1>
        <p className="mt-1.5 text-sm text-subtle">Elige un proyecto para consultar su dashboard de evaluación heurística, métricas e insights.</p>
      </header>
      {loading && (
        <div className="flex justify-center gap-3 py-24 text-sm text-subtle">
          <Loader2 className="h-5 w-5 animate-spin text-accent-indigo" /> Cargando proyectos...
        </div>
      )}
      {error && <p className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-5 text-sm text-accent-rose">{error}</p>}
      {!loading && !error && (
        <>
          <section className="mb-8 flex flex-wrap gap-3">
            {[
              { label: "Proyectos con datos", value: summary.projects, color: "text-accent-indigo" },
              { label: "Issues registrados", value: summary.alerts, color: "text-accent-rose" },
              { label: "Evaluaciones totales", value: summary.evaluations, color: "text-accent-emerald" },
            ].map((metric) => (
              <div key={metric.label} className="min-w-[155px] rounded-xl border border-border-subtle bg-bg-card px-[18px] py-[14px]">
                <p className={`font-mono text-[22px] leading-none ${metric.color}`}>{metric.value}</p>
                <p className="mt-1 text-xs text-subtle">{metric.label}</p>
              </div>
            ))}
          </section>
          {withData.length > 0 && <ProjectSection title={`Con datos — ${withData.length} proyecto${withData.length === 1 ? "" : "s"}`} items={withData} />}
          {pending.length > 0 && <ProjectSection title="En espera de evaluaciones" items={pending} muted />}
          {items.length === 0 && <p className="py-20 text-center text-sm text-subtle">No hay proyectos disponibles para analizar.</p>}
        </>
      )}
    </main>
  )
}

function ProjectSection({ title, items, muted = false }: { readonly title: string; readonly items: ProjectSummaryCard[]; readonly muted?: boolean }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle">{title}</h2>
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ProjectCard key={item.id} item={item} muted={muted} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ item, muted }: { readonly item: ProjectSummaryCard; readonly muted: boolean }) {
  const hasData = !muted
  const totalSeverity = item.severity.high + item.severity.medium + item.severity.low
  const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS["Sin datos"]

  return (
    <Link href={`/project/${item.id}/analytics`} className="group rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-400/60">
      <article className="overflow-hidden rounded-[14px] border border-border-subtle bg-bg-card transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-400/30 group-hover:bg-bg-elevated group-hover:shadow-[0_4px_24px_rgba(99,102,241,0.1)]">
        <div className="p-[18px] pb-[14px]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] uppercase tracking-[0.04em] text-subtle">{item.cliente || "Proyecto"}</p>
              <h3 className="truncate text-sm font-bold tracking-[-0.01em] text-foreground">{item.nombre}</h3>
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={hasData ? { color: statusColor, backgroundColor: `${statusColor}1a` } : undefined}
            >
              {hasData ? item.status : "Borrador"}
            </span>
          </div>
          <p className="line-clamp-2 min-h-9 text-xs leading-[1.55] text-subtle">{item.descripcion || "Sin descripción del proyecto."}</p>
        </div>
        {hasData ? (
          <>
            <div className="border-y border-border-subtle bg-surface-tint px-[18px] py-3">
              <div className="mb-2 flex justify-between text-[11px]">
                <span className="font-mono tracking-[0.04em] text-subtle">UX SCORE</span>
                <span className="font-mono font-medium" style={{ color: statusColor }}>{item.ux_score ?? "—"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-tint">
                <div className="h-full rounded-full" style={{ width: `${item.ux_score ?? 0}%`, backgroundColor: statusColor }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 px-[18px] py-2.5">
              {item.severity.high > 0 && <span className="rounded bg-rose-500/[0.1] px-1.5 py-0.5 text-[11px] font-semibold text-accent-rose">{item.severity.high} alta{item.severity.high === 1 ? "" : "s"}</span>}
              {item.severity.medium > 0 && <span className="rounded bg-orange-500/[0.1] px-1.5 py-0.5 text-[11px] font-semibold text-accent-orange">{item.severity.medium} media{item.severity.medium === 1 ? "" : "s"}</span>}
              {item.severity.low > 0 && <span className="rounded bg-amber-500/[0.1] px-1.5 py-0.5 text-[11px] font-semibold text-accent-amber">{item.severity.low} baja{item.severity.low === 1 ? "" : "s"}</span>}
              {totalSeverity === 0 && <span className="rounded bg-emerald-500/[0.1] px-1.5 py-0.5 text-[11px] font-semibold text-accent-emerald">Sin issues</span>}
            </div>
          </>
        ) : (
          <div className="border-t border-border-subtle px-[18px] py-3 text-xs text-subtle">No hay evaluaciones con resultados todavía.</div>
        )}
        <div className="flex items-center gap-2 border-t border-border-subtle px-[18px] py-3">
          <span className="text-[11px] text-subtle">{item.evaluators_count} evaluador{item.evaluators_count === 1 ? "" : "es"}</span>
          <span className="text-[11px] text-subtle">·</span>
          <span className="text-[11px] text-subtle">{item.evaluations_count} evaluación{item.evaluations_count === 1 ? "" : "es"}</span>
          <span className="ml-auto text-[11px] text-subtle">{formatDate(item.last_evaluation_at)}</span>
          {hasData && <ArrowRight className="h-3.5 w-3.5 text-accent-indigo opacity-40 transition-opacity group-hover:opacity-100" />}
        </div>
      </article>
    </Link>
  )
}
