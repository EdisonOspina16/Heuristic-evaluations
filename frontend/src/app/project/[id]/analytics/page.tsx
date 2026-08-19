"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft, BarChart3, Check, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { projectsService, type Project, type ProjectAssignment } from "@/features/projects/services/projects.service"
import type { EvaluacionResumen, PlantillaEstructura } from "@/types/evaluations"

type Tab = "dashboard" | "issues" | "insights"
type Data = { project: Project; evaluations: EvaluacionResumen[]; assignments: ProjectAssignment[]; templates: PlantillaEstructura[] }
type Dimension = { id: number; name: string; average: number; warnings: number; count: number }
type Analytics = { evaluated: EvaluacionResumen[]; dimensions: Dimension[]; average: number | null; alerts: Dimension[]; timeline: { label: string; value: number; date: string }[]; evaluators: string[]; completed: number }
const complete = new Set(["completada", "completado", "finalizada"])
const avatarColors = ["text-indigo-300 border-indigo-400/35 bg-indigo-400/10", "text-emerald-300 border-emerald-400/35 bg-emerald-400/10", "text-pink-300 border-pink-400/35 bg-pink-400/10", "text-orange-300 border-orange-400/35 bg-orange-400/10"]

function date(value?: string) { return value ? new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—" }
function number(value: number) { return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value) }
function initials(name?: string) { return (name || "E").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() }

function Avatar({ name, index, small = false }: { name?: string; index: number; small?: boolean }) {
  return <span title={name} className={`inline-flex shrink-0 items-center justify-center rounded-full border font-semibold ${small ? "h-[22px] w-[22px] text-[8px]" : "h-7 w-7 text-[10px]"} ${avatarColors[index % avatarColors.length]}`}>{initials(name)}</span>
}

function Status({ dataReady }: { dataReady: boolean }) {
  return <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${dataReady ? "bg-emerald-400/10 text-emerald-300" : "bg-zinc-500/15 text-zinc-400"}`}>{dataReady ? "Activa" : "Sin resultados"}</span>
}

export default function ProjectAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const [data, setData] = useState<Data | null>(null)
  const [tab, setTab] = useState<Tab>("dashboard")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!Number.isFinite(projectId)) return
    async function load() {
      try {
        const [project, evaluations, assignments] = await Promise.all([projectsService.getProject(projectId), evaluationsService.getEvaluationsByProject(projectId), projectsService.getAssignments(projectId).catch(() => [])])
        const ids = [...new Set(evaluations.map((evaluation) => evaluation.plantilla_id))]
        const templates = await Promise.all(ids.map((templateId) => evaluationsService.getEstructura(templateId).catch(() => null)))
        setData({ project, evaluations, assignments, templates: templates.filter((item): item is PlantillaEstructura => item !== null) })
      } catch { setError("No se pudo cargar la información analítica del proyecto.") } finally { setLoading(false) }
    }
    load()
  }, [projectId])

  const analytics = useMemo<Analytics | null>(() => {
    if (!data) return null
    const names = new Map(data.templates.flatMap((template) => template.dimensiones.map((dimension) => [dimension.id, dimension.nombre])))
    const evaluated = data.evaluations.filter((evaluation) => evaluation.resultados_dimension.length > 0)
    const buckets = new Map<number, { total: number; count: number; warnings: number }>()
    evaluated.forEach((evaluation) => evaluation.resultados_dimension.forEach((result) => {
      const bucket = buckets.get(result.dimension_id) || { total: 0, count: 0, warnings: 0 }
      bucket.total += Number(result.promedio); bucket.count += 1; bucket.warnings += result.warnings; buckets.set(result.dimension_id, bucket)
    }))
    const dimensions: Dimension[] = [...buckets.entries()].map(([dimensionId, bucket]) => ({ id: dimensionId, name: names.get(dimensionId) || `Dimensión ${dimensionId}`, average: bucket.total / bucket.count, warnings: bucket.warnings, count: bucket.count })).sort((a, b) => a.average - b.average)
    const totalDimensionResults = dimensions.reduce((sum, item) => sum + item.count, 0)
    const average = totalDimensionResults ? dimensions.reduce((sum, item) => sum + item.average * item.count, 0) / totalDimensionResults : null
    const alerts = dimensions.filter((dimension) => dimension.warnings > 0).sort((a, b) => b.warnings - a.warnings || a.average - b.average)
    const timeline = [...evaluated].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((evaluation, index) => ({ label: `Ev. ${index + 1}`, value: evaluation.resultados_dimension.reduce((sum, result) => sum + Number(result.promedio), 0) / evaluation.resultados_dimension.length, date: evaluation.created_at }))
    const evaluators = data.assignments.length ? data.assignments.map((assignment) => assignment.evaluator_name) : [...new Set(data.evaluations.map((evaluation) => evaluation.evaluador_nombre).filter(Boolean))] as string[]
    return { evaluated, dimensions, average, alerts, timeline, evaluators, completed: data.evaluations.filter((evaluation) => complete.has(evaluation.estado)).length }
  }, [data])

  if (!Number.isFinite(projectId)) return <ErrorState text="El proyecto solicitado no es válido." />
  if (loading) return <main className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-zinc-500"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /> Cargando analytics...</main>
  if (error || !data || !analytics) return <ErrorState text={error || "No hay información disponible."} />
  const ready = analytics.evaluated.length > 0

  return <main className="min-h-full bg-[#111318] text-[#eef0f6]">
    <header className="border-b border-white/[0.04] bg-[#111318] px-6 md:px-9">
      <div className="flex items-center gap-2 pt-5 text-[13px]"><Link href="/analytics" className="inline-flex items-center gap-1.5 text-[#5f6580] transition-colors hover:text-[#8b91a8]"><ArrowLeft className="h-3.5 w-3.5" /> Analytics</Link><ChevronRight className="h-3.5 w-3.5 text-[#4f546b]" /><span className="truncate text-[#8b91a8]">{data.project.nombre}</span><Status dataReady={ready} /></div>
      <div className="mt-4 flex flex-col gap-4 pb-5 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-xl font-bold tracking-[-0.02em] text-[#eef0f6]">{data.project.nombre}</h1><p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#5f6580]">{data.project.descripcion || "Resultados de las evaluaciones heurísticas del proyecto."}</p></div>
        <div className="flex items-center gap-4"><div className="flex -space-x-2">{analytics.evaluators.slice(0, 4).map((evaluator, index) => <Avatar key={`${evaluator}-${index}`} name={evaluator} index={index} />)}</div><div className="border-l border-white/[0.06] pl-4 text-right"><p className="text-[11px] text-[#5f6580]">Última evaluación</p><p className="mt-0.5 text-[13px] font-medium text-[#8b91a8]">{date(data.evaluations[0]?.created_at)}</p></div></div>
      </div>
      <nav className="flex gap-1"><TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")}>Dashboard</TabButton><TabButton active={tab === "issues"} onClick={() => setTab("issues")}>Alertas ({analytics.alerts.length})</TabButton><TabButton active={tab === "insights"} onClick={() => setTab("insights")}><Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-indigo-300" />AI Insights</TabButton></nav>
    </header>
    <div className="p-6 md:p-7 md:px-9">{!ready ? <NoResults evaluations={data.evaluations.length} /> : tab === "dashboard" ? <Dashboard analytics={analytics} /> : tab === "issues" ? <Alerts analytics={analytics} /> : <Insights analytics={analytics} />}</div>
  </main>
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`-mb-px border-b-2 px-4 py-2 text-[13px] transition-colors ${active ? "border-indigo-500 font-semibold text-[#eef0f6]" : "border-transparent text-[#5f6580] hover:text-[#8b91a8]"}`}>{children}</button>
}

function Dashboard({ analytics }: { analytics: Analytics }) {
  const maximum = Math.max(...analytics.dimensions.map((dimension) => dimension.average), 1)
  const totalWarnings = analytics.alerts.reduce((sum, alert) => sum + alert.warnings, 0)
  return <div className="space-y-[14px]">
    <section className="grid gap-[14px] xl:grid-cols-[260px_minmax(0,1fr)_280px]">
      <Panel className="flex flex-col gap-5 p-5">
        <div><p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#5f6580]">Puntaje consolidado</p><div className="mt-2 flex items-end gap-2"><strong className="font-mono text-5xl font-medium tracking-[-0.04em] text-indigo-300">{analytics.average === null ? "—" : number(analytics.average)}</strong><span className="mb-1 font-mono text-sm text-[#5f6580]">promedio</span></div><span className="mt-2 inline-flex rounded-md bg-indigo-400/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">Resultados registrados</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-indigo-500/55 to-indigo-400" /></div>
        <div className="grid grid-cols-2 gap-2">{[{ label: "Resultados", value: analytics.evaluated.length, color: "text-[#eef0f6]" }, { label: "Alertas", value: totalWarnings, color: "text-rose-400" }, { label: "Evaluadores", value: analytics.evaluators.length, color: "text-[#eef0f6]" }, { label: "Dimensiones", value: analytics.dimensions.length, color: "text-[#eef0f6]" }].map((item) => <div key={item.label} className="rounded-lg bg-white/[0.025] p-2.5"><p className={`font-mono text-lg ${item.color}`}>{item.value}</p><p className="mt-0.5 text-[10px] text-[#5f6580]">{item.label}</p></div>)}</div>
        <div><p className="mb-2 text-[11px] text-[#5f6580]">{analytics.evaluators.length} evaluadores · {analytics.completed} finalizadas</p><div className="space-y-2">{analytics.evaluators.map((evaluator, index) => <div key={`${evaluator}-${index}`} className="flex items-center gap-2"><Avatar name={evaluator} index={index} small /><span className="truncate text-xs font-medium text-[#8b91a8]">{evaluator}</span></div>)}</div></div>
      </Panel>
      <Panel className="p-5"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-[13px] font-bold text-[#eef0f6]">Ranking de dimensiones</h2><p className="mt-1 text-xs text-[#5f6580]">Promedios consolidados de las dimensiones evaluadas</p></div><span className="text-[11px] text-[#5f6580]">comparación relativa</span></div><div className="space-y-3.5">{analytics.dimensions.map((dimension) => <div key={dimension.id}><div className="mb-1.5 flex items-center justify-between gap-4"><p className="truncate text-[11px] text-[#8b91a8]">{dimension.name}</p><span className="font-mono text-[11px] text-[#eef0f6]">{number(dimension.average)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.045]"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(6, (dimension.average / maximum) * 100)}%` }} /></div></div>)}</div></Panel>
      <Panel className="flex flex-col p-[18px]"><h2 className="text-[13px] font-bold text-[#eef0f6]">Alertas prioritarias</h2><p className="mt-1 text-xs text-[#5f6580]">Advertencias registradas por dimensión</p><div className="mt-4 space-y-1.5">{analytics.alerts.length ? analytics.alerts.slice(0, 6).map((alert) => <div key={alert.id} className="flex gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5"><span className="mt-0.5 h-7 w-[3px] shrink-0 rounded-full bg-rose-500" /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-medium leading-4 text-[#eef0f6]">{alert.name}</p><p className="mt-1 text-[10px] text-[#5f6580]">{alert.warnings} alerta{alert.warnings === 1 ? "" : "s"} registrada{alert.warnings === 1 ? "" : "s"}</p></div><span className="h-fit rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">Alerta</span></div>) : <Empty label="No hay alertas críticas registradas." />}</div></Panel>
    </section>
    <section className="grid gap-[14px] lg:grid-cols-[minmax(0,1fr)_280px]">
      <Panel className="p-5"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-[13px] font-bold text-[#eef0f6]">Resultados a lo largo del tiempo</h2><p className="mt-1 text-xs text-[#5f6580]">Promedio registrado en cada evaluación completada</p></div><span className="font-mono text-[11px] text-[#5f6580]">Evolución</span></div>{analytics.timeline.length > 1 ? <ResponsiveContainer width="100%" height={170}><AreaChart data={analytics.timeline} margin={{ top: 5, right: 6, left: -20, bottom: 0 }}><defs><linearGradient id="analytics-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.32} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" /><XAxis dataKey="label" tick={{ fill: "#5f6580", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#5f6580", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#1c1f2b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8b91a8" }} itemStyle={{ color: "#a5b4fc" }} /><Area type="monotone" dataKey="value" name="Promedio" stroke="#6366f1" strokeWidth={2} fill="url(#analytics-gradient)" dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 0 }} /></AreaChart></ResponsiveContainer> : <Empty label="Se requieren dos evaluaciones con resultados para mostrar una tendencia." />}</Panel>
      <Panel className="p-5"><h2 className="text-[13px] font-bold text-[#eef0f6]">Cobertura del análisis</h2><p className="mt-1 text-xs text-[#5f6580]">Disponibilidad de los datos del proyecto</p><div className="mt-5 space-y-3">{[{ label: "Evaluaciones con resultados", value: analytics.evaluated.length, color: "bg-indigo-400" }, { label: "Dimensiones con datos", value: analytics.dimensions.length, color: "bg-emerald-400" }, { label: "Alertas registradas", value: totalWarnings, color: "bg-rose-400" }].map((item) => <div key={item.label} className="flex items-center gap-2.5"><span className={`h-2 w-2 rounded-full ${item.color}`} /><span className="flex-1 text-xs text-[#8b91a8]">{item.label}</span><span className="font-mono text-xs text-[#eef0f6]">{item.value}</span></div>)}</div></Panel>
    </section>
  </div>
}

function Alerts({ analytics }: { analytics: Analytics }) {
  const [onlyAlerts, setOnlyAlerts] = useState(false)
  const list = onlyAlerts ? analytics.alerts : analytics.dimensions
  return <div><div className="mb-5 flex flex-wrap gap-1.5"><Filter active={!onlyAlerts} onClick={() => setOnlyAlerts(false)}>Todas <span>{analytics.dimensions.length}</span></Filter><Filter active={onlyAlerts} onClick={() => setOnlyAlerts(true)} tone="alert">Con alertas <span>{analytics.alerts.length}</span></Filter></div><div className="space-y-2">{list.length ? list.map((item) => <Panel key={item.id} className="p-4"><div className="flex gap-3"><span className={`mt-0.5 min-h-12 w-[3px] rounded-full ${item.warnings ? "bg-rose-500" : "bg-indigo-500"}`} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-4"><h2 className="text-sm font-semibold text-[#eef0f6]">{item.name}</h2><span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.warnings ? "bg-rose-500/10 text-rose-400" : "bg-indigo-500/10 text-indigo-300"}`}>{item.warnings ? "Alerta" : "Sin alertas"}</span></div><p className="mt-2 text-[13px] leading-5 text-[#8b91a8]">Promedio consolidado: {number(item.average)}. Esta dimensión reúne {item.count} resultado{item.count === 1 ? "" : "s"} de evaluación.</p><div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#5f6580]"><span className="rounded bg-indigo-500/10 px-1.5 py-0.5 font-semibold text-indigo-300">Dimensión</span><span>{item.warnings} alerta{item.warnings === 1 ? "" : "s"} registrada{item.warnings === 1 ? "" : "s"}</span></div></div></div></Panel>) : <Empty label="No hay dimensiones con alertas registradas." />}</div></div>
}

function Insights({ analytics }: { analytics: Analytics }) {
  const lowest = analytics.dimensions[0]
  const mostAlerts = analytics.alerts[0]
  const insights = [{ tone: "critical", title: lowest ? `${lowest.name} requiere atención prioritaria` : "Sin resultados", body: lowest ? `Registra el promedio consolidado más bajo (${number(lowest.average)}) entre las dimensiones evaluadas. Conviene validar los hallazgos asociados antes de ampliar el alcance de la evaluación.` : "Aún no hay resultados disponibles." }, ...(mostAlerts ? [{ tone: "warning", title: `${mostAlerts.warnings} alertas en ${mostAlerts.name}`, body: `Las reglas de la plantilla registraron esta cantidad de alertas para la dimensión. Prioriza la revisión de los flujos que cubre y contrasta el resultado con las observaciones de los evaluadores.` }] : []), { tone: "info", title: "Cobertura actual del análisis", body: `El análisis consolida ${analytics.evaluated.length} evaluaciones con resultados y ${analytics.dimensions.length} dimensiones. Los insights se actualizan al registrar nuevas evaluaciones.` }]
  const styles = { critical: "border-rose-400/20 bg-rose-500/[0.06] text-rose-400", warning: "border-orange-400/20 bg-orange-500/[0.06] text-orange-400", info: "border-indigo-400/20 bg-indigo-500/[0.06] text-indigo-300" } as const
  return <div className="max-w-[780px]"><div className="mb-6 flex gap-3 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06] p-4"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" /><div><h2 className="text-sm font-bold text-indigo-300">AI-Generated Insights</h2><p className="mt-1 text-xs leading-5 text-[#8b91a8]">Análisis automático de {analytics.evaluated.length} evaluaciones, {analytics.evaluators.length} evaluadores y {analytics.dimensions.length} dimensiones con datos.</p></div><span className="ml-auto inline-flex h-fit items-center gap-1 rounded bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"><Check className="h-3 w-3" /> Completo</span></div><div className="space-y-2.5">{insights.map((insight) => <div key={insight.title} className={`rounded-xl border p-4 ${styles[insight.tone as keyof typeof styles]}`}><h3 className="text-[13px] font-bold text-[#eef0f6]">{insight.title}</h3><p className="mt-1.5 text-[13px] leading-5 text-[#8b91a8]">{insight.body}</p></div>)}</div><div className="mt-5 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 text-[11px] leading-5 text-[#5f6580]">Estos insights se derivan de los datos de evaluación registrados por el equipo. Complementan, pero no sustituyen, la revisión profesional de UX.</div></div>
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-[14px] border border-white/[0.07] bg-[#161920] ${className}`}>{children}</section> }
function Empty({ label }: { label: string }) { return <p className="py-6 text-center text-[13px] text-[#5f6580]">{label}</p> }
function Filter({ children, active, onClick, tone = "default" }: { children: React.ReactNode; active: boolean; onClick: () => void; tone?: "default" | "alert" }) { return <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${active ? tone === "alert" ? "border-rose-400/25 bg-rose-500/10 font-semibold text-rose-400" : "border-indigo-400/25 bg-indigo-500/15 font-semibold text-indigo-300" : "border-white/[0.07] bg-white/[0.025] text-[#5f6580] hover:text-[#8b91a8]"}`}>{children}</button> }

function NoResults({ evaluations }: { evaluations: number }) { return <div className="flex min-h-[340px] flex-col items-center justify-center text-center"><div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-[#5f6580]"><BarChart3 className="h-6 w-6" /></div><h2 className="text-[15px] font-semibold text-[#8b91a8]">Aún no hay resultados para analizar</h2><p className="mt-2 max-w-md text-[13px] leading-5 text-[#5f6580]">Hay {evaluations} evaluaciones registradas. Los gráficos y los insights se habilitarán cuando una evaluación guarde sus resultados por dimensión.</p></div> }
function ErrorState({ text }: { text: string }) { return <main className="mx-auto max-w-7xl p-8"><Link href="/analytics" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver a Analytics</Link><p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">{text}</p></main> }
