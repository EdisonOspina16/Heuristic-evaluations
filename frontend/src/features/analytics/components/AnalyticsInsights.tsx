import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Loader2, Sparkles } from "lucide-react"
import { Children } from "react"
import type { ProjectAnalyticsResponse } from "../types"

interface AnalyticsInsightsProps {
  readonly data: ProjectAnalyticsResponse
  readonly content: string
  readonly loading: boolean
  readonly error: string
  readonly onGenerate: () => void
  readonly onCancel: () => void
}

function markdownHeading(children: React.ReactNode, level: "h1" | "h2" | "h3") {
  const text = Children.toArray(children)
    .filter((child): child is string | number => typeof child === "string" || typeof child === "number")
    .map(String)
    .join("")
  let tone = "border-indigo-400/20 bg-indigo-500/[0.06] text-accent-indigo"
  if (text.includes("ALTA") || text.includes("alta")) {
    tone = "border-rose-400/30 bg-rose-500/[0.08] text-accent-rose"
  } else if (text.includes("MEDIA") || text.includes("media")) {
    tone = "border-orange-400/30 bg-orange-500/[0.08] text-accent-orange"
  } else if (text.includes("BAJA") || text.includes("baja")) {
    tone = "border-emerald-400/30 bg-emerald-500/[0.08] text-accent-emerald"
  }
  let size = "text-[15px]"
  if (level === "h1") {
    size = "text-xl"
  } else if (level === "h2") {
    size = "text-lg"
  }
  const Tag = level
  return <Tag className={`mb-3 mt-6 rounded-lg border px-3 py-2 font-bold ${size} ${tone}`}>{children}</Tag>
}

const markdownComponents: Components = {
  h1: ({ children }) => markdownHeading(children, "h1"),
  h2: ({ children }) => markdownHeading(children, "h2"),
  h3: ({ children }) => markdownHeading(children, "h3"),
  p: ({ children }) => <p className="mb-3">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  hr: () => <hr className="my-6 border-border-subtle" />,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-accent-indigo pl-4 italic">{children}</blockquote>,
}

export function AnalyticsInsights({ data, content, loading, error, onGenerate, onCancel }: AnalyticsInsightsProps) {
  return (
    <div className="max-w-[780px]">
      <div className="mb-6 flex gap-3 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.08] p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-indigo" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-accent-indigo">AI Insights</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Genera un análisis de {data.summary.total_evaluations} evaluaciones, {data.summary.evaluators_count} evaluadores y {data.heuristics.length} heurísticas con datos.</p>
        </div>
        {loading ? (
          <button type="button" onClick={onCancel} className="inline-flex h-fit shrink-0 items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-muted hover:text-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Cancelar</button>
        ) : (
          <button type="button" onClick={onGenerate} className="inline-flex h-fit shrink-0 items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400"><Sparkles className="h-3.5 w-3.5" /> {content ? "Regenerar" : "Generar insights"}</button>
        )}
      </div>
      {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.08] p-4 text-sm text-accent-rose">{error}</div>}
      {content ? (
        <article className="max-w-none text-[13px] leading-6 text-muted">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
          {loading && <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-accent-indigo align-middle" />}
        </article>
      ) : (
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface-tint p-8 text-center text-sm text-subtle">Presiona “Generar insights” para solicitar un análisis.</div>
      )}
      <div className="mt-5 rounded-lg border border-border-subtle bg-surface-tint p-3 text-[11px] leading-5 text-subtle">Estos insights complementan, pero no sustituyen, la revisión profesional de UX.</div>
    </div>
  )
}
