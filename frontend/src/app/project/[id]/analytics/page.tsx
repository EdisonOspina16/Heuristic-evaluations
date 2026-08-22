"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, BarChart3, Check, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { analyticsService } from "@/features/analytics/services/analytics.service"
import { ProjectAnalyticsResponse, Severity } from "@/features/analytics/types"
import { SEVERITY_COLORS, SEVERITY_LABELS, STATUS_COLORS } from "@/features/analytics/colors"
import { ScoreRing } from "@/features/analytics/components/ScoreRing"
import { SeverityDonutChart } from "@/features/analytics/components/SeverityDonutChart"
import { HeuristicBarChart } from "@/features/analytics/components/HeuristicBarChart"
import { TimelineChart } from "@/features/analytics/components/TimelineChart"
import { IssuesList } from "@/features/analytics/components/IssuesList"
import { buildInsights } from "@/features/analytics/utils/insights"

type Tab = "overview" | "issues" | "insights"

function number(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value)
}

export default function ProjectAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const [data, setData] = useState<ProjectAnalyticsResponse | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!Number.isFinite(projectId)) return
    async function load() {
      try {
        setData(await analyticsService.getProjectAnalytics(projectId))
      } catch {
        setError("No se pudo cargar la información analítica del proyecto.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (!Number.isFinite(projectId)) return <ErrorState text="El proyecto solicitado no es válido." />
  if (loading) return <main className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-subtle"><Loader2 className="h-5 w-5 animate-spin text-accent-indigo" /> Cargando analytics...</main>
  if (error || !data) return <ErrorState text={error || "No hay información disponible."} />

  const ready = data.has_data
  const statusColor = STATUS_COLORS[data.summary.status] || STATUS_COLORS["Sin datos"]

  return (
    <main className="min-h-full bg-bg-deep text-foreground">
      <header className="border-b border-border-subtle bg-bg-deep px-6 md:px-9">
        <div className="flex items-center gap-2 pt-5 text-[13px]">
          <Link href="/analytics" className="inline-flex items-center gap-1.5 text-subtle transition-colors hover:text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Analytics</Link>
          <ChevronRight className="h-3.5 w-3.5 text-subtle" />
          <span className="truncate text-muted">{data.project.nombre}</span>
          <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={ready ? { color: statusColor, backgroundColor: `${statusColor}1a` } : undefined}>
            {ready ? data.summary.status : "Sin resultados"}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-4 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-[-0.02em] text-foreground">{data.project.nombre}</h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-subtle">{data.project.descripcion || "Resultados de las evaluaciones heurísticas del proyecto."}</p>
          </div>
        </div>
        <nav className="flex gap-1">
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Dashboard</TabButton>
          <TabButton active={tab === "issues"} onClick={() => setTab("issues")}>Issues ({data.issues.length})</TabButton>
          <TabButton active={tab === "insights"} onClick={() => setTab("insights")}><Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-accent-indigo" />AI Insights</TabButton>
        </nav>
      </header>
      <div className="p-6 md:p-7 md:px-9">
        {!ready ? (
          <NoResults evaluations={data.summary.total_evaluations} />
        ) : tab === "overview" ? (
          <Overview data={data} />
        ) : tab === "issues" ? (
          <IssuesTab data={data} />
        ) : (
          <Insights data={data} />
        )}
      </div>
    </main>
  )
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`-mb-px border-b-2 px-4 py-2 text-[13px] transition-colors ${active ? "border-indigo-500 font-semibold text-foreground" : "border-transparent text-subtle hover:text-muted"}`}>{children}</button>
}

function Overview({ data }: { data: ProjectAnalyticsResponse }) {
  const priorityIssues = data.issues.slice(0, 6)
  return (
    <div className="space-y-[14px]">
      <section className="grid gap-[14px] xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        <Panel className="flex flex-col items-center gap-5 p-5">
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
        </Panel>
        <Panel className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-[13px] font-bold text-foreground">Distribución de severidad</h2>
              <p className="mt-1 text-xs text-subtle">Issues detectados en evaluaciones heurísticas</p>
            </div>
          </div>
          <SeverityDonutChart severity={data.severity_breakdown} />
        </Panel>
        <Panel className="flex flex-col p-[18px]">
          <h2 className="text-[13px] font-bold text-foreground">Issues prioritarios</h2>
          <p className="mt-1 text-xs text-subtle">Ordenados por severidad y acuerdo entre evaluadores</p>
          <div className="mt-4">
            <IssuesList issues={priorityIssues} emptyLabel="No hay issues prioritarios registrados." />
          </div>
        </Panel>
      </section>
      <section className="grid gap-[14px] lg:grid-cols-[minmax(0,1fr)_280px]">
        <Panel className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-[13px] font-bold text-foreground">Issues por heurística</h2>
              <p className="mt-1 text-xs text-subtle">Severidad acumulada por categoría de Nielsen + Tognazzini</p>
            </div>
          </div>
          <HeuristicBarChart heuristics={data.heuristics} />
        </Panel>
        <Panel className="p-5">
          <h2 className="text-[13px] font-bold text-foreground">Resultados a lo largo del tiempo</h2>
          <p className="mt-1 text-xs text-subtle">Promedio normalizado (0-100) por evaluación</p>
          <TimelineChart timeline={data.timeline} />
        </Panel>
      </section>
    </div>
  )
}

function IssuesTab({ data }: { data: ProjectAnalyticsResponse }) {
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
          <Filter key={item.key} active={filter === item.key} onClick={() => setFilter(item.key)} color={item.key === "all" ? undefined : SEVERITY_COLORS[item.key as Severity]}>
            {item.label} <span>{item.count}</span>
          </Filter>
        ))}
      </div>
      <Panel className="p-4">
        <IssuesList issues={list} emptyLabel="No hay issues para este filtro." />
      </Panel>
    </div>
  )
}

function Insights({ data }: { data: ProjectAnalyticsResponse }) {
  const insights = buildInsights(data)
  const styles: Record<string, string> = {
    critical: "border-rose-400/20 bg-rose-500/[0.08] text-accent-rose",
    warning: "border-orange-400/20 bg-orange-500/[0.08] text-accent-orange",
    info: "border-indigo-400/20 bg-indigo-500/[0.08] text-accent-indigo",
    success: "border-emerald-400/20 bg-emerald-500/[0.08] text-accent-emerald",
  }
  return (
    <div className="max-w-[780px]">
      <div className="mb-6 flex gap-3 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.08] p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-indigo" />
        <div>
          <h2 className="text-sm font-bold text-accent-indigo">AI-Generated Insights</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Análisis automático de {data.summary.total_evaluations} evaluaciones, {data.summary.evaluators_count} evaluadores y {data.heuristics.length} heurísticas con datos.</p>
        </div>
        <span className="ml-auto inline-flex h-fit items-center gap-1 rounded bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-accent-emerald"><Check className="h-3 w-3" /> Completo</span>
      </div>
      <div className="space-y-2.5">
        {insights.map((insight, index) => (
          <div
            key={insight.title}
            className={`rounded-xl border p-4 opacity-0 ${styles[insight.tone]}`}
            style={{ animation: `analytics-insight-in 350ms ease-out ${index * 120}ms forwards` }}
          >
            <h3 className="text-[13px] font-bold text-foreground">{insight.title}</h3>
            <p className="mt-1.5 text-[13px] leading-5 text-muted">{insight.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-border-subtle bg-surface-tint p-3 text-[11px] leading-5 text-subtle">
        Estos insights se derivan de los datos de evaluación registrados por el equipo. Complementan, pero no sustituyen, la revisión profesional de UX.
      </div>
    </div>
  )
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border border-border-subtle bg-bg-card ${className}`}>{children}</section>
}

function Filter({ children, active, onClick, color }: { children: React.ReactNode; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${active ? "font-semibold" : "border-border-subtle bg-surface-tint text-subtle hover:text-muted"}`}
      style={active ? { borderColor: color ? `${color}40` : "var(--color-accent-indigo)", backgroundColor: color ? `${color}1a` : "rgba(99,102,241,0.15)", color: color || "var(--color-accent-indigo)" } : undefined}
    >
      {children}
    </button>
  )
}

function NoResults({ evaluations }: { evaluations: number }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-xl border border-border-subtle bg-surface-tint p-3 text-subtle"><BarChart3 className="h-6 w-6" /></div>
      <h2 className="text-[15px] font-semibold text-muted">No has realizado suficientes evaluaciones heurísticas para poder obtener su análisis.</h2>
      <p className="mt-2 max-w-md text-[13px] leading-5 text-subtle">
        {evaluations > 0
          ? `Hay ${evaluations} evaluación${evaluations === 1 ? "" : "es"} registrada${evaluations === 1 ? "" : "s"} en este proyecto, pero ninguna guardó resultados por dimensión todavía.`
          : "Este proyecto aún no tiene evaluaciones registradas."}
      </p>
    </div>
  )
}

function ErrorState({ text }: { text: string }) {
  return (
    <main className="mx-auto max-w-7xl p-8">
      <Link href="/analytics" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Volver a Analytics</Link>
      <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-accent-rose">{text}</p>
    </main>
  )
}
