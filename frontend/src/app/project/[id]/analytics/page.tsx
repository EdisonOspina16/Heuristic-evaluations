"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, BarChart3, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { analyticsService } from "@/features/analytics/services/analytics.service"
import { ProjectAnalyticsResponse } from "@/features/analytics/types"
import { STATUS_COLORS } from "@/features/analytics/colors"
import { AnalyticsOverview } from "@/features/analytics/components/AnalyticsOverview"
import { AnalyticsIssues } from "@/features/analytics/components/AnalyticsIssues"
import { AnalyticsInsights } from "@/features/analytics/components/AnalyticsInsights"

type Tab = "overview" | "issues" | "insights"

export default function ProjectAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const [data, setData] = useState<ProjectAnalyticsResponse | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [aiContent, setAiContent] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!Number.isFinite(projectId)) return
    let active = true
    analyticsService.getProjectAnalytics(projectId)
      .then((result) => { if (active) setData(result) })
      .catch(() => { if (active) setError("No se pudo cargar la información analítica del proyecto.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [projectId])

  useEffect(() => () => abortRef.current?.abort(), [])

  const generateInsights = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setAiContent("")
    setAiError("")
    setAiLoading(true)
    try {
      await analyticsService.streamProjectAiInsights(projectId, (event) => {
        if (event.type === "token") setAiContent((current) => current + event.text)
        if (event.type === "error") setAiError(event.message)
      }, controller.signal)
    } catch (streamError: unknown) {
      if ((streamError as Error)?.name !== "AbortError") setAiError(streamError instanceof Error ? streamError.message : "No se pudieron generar los insights.")
    } finally {
      setAiLoading(false)
    }
  }

  if (!Number.isFinite(projectId)) return <ErrorState text="El proyecto solicitado no es válido." />
  if (loading) return <main className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-subtle"><Loader2 className="h-5 w-5 animate-spin text-accent-indigo" /> Cargando analytics...</main>
  if (error || !data) return <ErrorState text={error || "No hay información disponible."} />

  const ready = data.has_data
  const statusColor = STATUS_COLORS[data.summary.status] || STATUS_COLORS["Sin datos"]
  let tabContent: React.ReactNode = <NoResults evaluations={data.summary.total_evaluations} />
  if (ready) {
    if (tab === "overview") tabContent = <AnalyticsOverview data={data} />
    else if (tab === "issues") tabContent = <AnalyticsIssues data={data} />
    else tabContent = <AnalyticsInsights data={data} content={aiContent} loading={aiLoading} error={aiError} onGenerate={generateInsights} onCancel={() => abortRef.current?.abort()} />
  }

  return (
    <main className="min-h-full bg-bg-deep text-foreground">
      <header className="border-b border-border-subtle bg-bg-deep px-6 md:px-9">
        <div className="flex items-center gap-2 pt-5 text-[13px]">
          <Link href="/analytics" className="inline-flex items-center gap-1.5 text-subtle hover:text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Analytics</Link>
          <ChevronRight className="h-3.5 w-3.5 text-subtle" />
          <span className="truncate text-muted">{data.project.nombre}</span>
          <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={ready ? { color: statusColor, backgroundColor: `${statusColor}1a` } : undefined}>{ready ? data.summary.status : "Sin resultados"}</span>
        </div>
        <div className="mt-4 pb-5"><h1 className="text-xl font-bold tracking-[-0.02em]">{data.project.nombre}</h1><p className="mt-1 max-w-2xl text-[13px] leading-5 text-subtle">{data.project.descripcion || "Resultados de las evaluaciones heurísticas del proyecto."}</p></div>
        <nav className="flex gap-1" aria-label="Secciones de analítica">
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Dashboard</TabButton>
          <TabButton active={tab === "issues"} onClick={() => setTab("issues")}>Issues ({data.issues.length})</TabButton>
          <TabButton active={tab === "insights"} onClick={() => setTab("insights")}><Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-accent-indigo" />AI Insights</TabButton>
        </nav>
      </header>
      <div className="p-6 md:p-7 md:px-9">
        {tabContent}
      </div>
    </main>
  )
}

function TabButton({ children, active, onClick }: Readonly<{ children: React.ReactNode; active: boolean; onClick: () => void }>) {
  return <button type="button" onClick={onClick} className={`-mb-px border-b-2 px-4 py-2 text-[13px] transition-colors ${active ? "border-indigo-500 font-semibold text-foreground" : "border-transparent text-subtle hover:text-muted"}`}>{children}</button>
}

function NoResults({ evaluations }: Readonly<{ evaluations: number }>) {
  return <div className="flex min-h-[340px] flex-col items-center justify-center text-center"><div className="mb-4 rounded-xl border border-border-subtle bg-surface-tint p-3 text-subtle"><BarChart3 className="h-6 w-6" /></div><h2 className="text-[15px] font-semibold text-muted">No hay resultados suficientes para mostrar el análisis.</h2><p className="mt-2 max-w-md text-[13px] leading-5 text-subtle">{evaluations > 0 ? `Hay ${evaluations} evaluación${evaluations === 1 ? "" : "es"} registrada${evaluations === 1 ? "" : "s"}, pero ninguna guardó resultados por dimensión todavía.` : "Este proyecto aún no tiene evaluaciones registradas."}</p></div>
}

function ErrorState({ text }: Readonly<{ text: string }>) {
  return <main className="mx-auto max-w-7xl p-8"><Link href="/analytics" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Volver a Analytics</Link><p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-accent-rose">{text}</p></main>
}
