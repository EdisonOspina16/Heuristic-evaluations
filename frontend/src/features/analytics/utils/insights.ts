import { ProjectAnalyticsResponse } from "../types"

export type InsightTone = "critical" | "warning" | "info" | "success"

export interface Insight {
  tone: InsightTone
  title: string
  body: string
}

function issueWeight(h: { high: number; medium: number; low: number }) {
  return h.high * 3 + h.medium * 2 + h.low
}

/**
 * Reglas simples derivadas del mismo payload que ya consume el dashboard
 * (sin dependencias de LLM), en la misma línea que la pestaña "AI Insights"
 * ya existente en el proyecto.
 */
export function buildInsights(data: ProjectAnalyticsResponse): Insight[] {
  const insights: Insight[] = []

  const worst = [...data.heuristics].sort((a, b) => issueWeight(b) - issueWeight(a))[0]
  if (worst && issueWeight(worst) > 0) {
    insights.push({
      tone: worst.high > 0 ? "critical" : "warning",
      title: `${worst.name} concentra la mayor cantidad de issues`,
      body: `Registra ${worst.high} de severidad alta, ${worst.medium} media y ${worst.low} baja. Conviene priorizar la revisión de esta heurística antes de ampliar el alcance de la evaluación.`,
    })
  }

  const total = data.summary.total_issues
  if (total > 0) {
    const density = Math.round((data.summary.high_priority_issues / total) * 100)
    insights.push({
      tone: density >= 40 ? "critical" : density > 0 ? "warning" : "success",
      title: `${density}% de los issues son de severidad alta`,
      body:
        density === 0
          ? `De los ${total} issues detectados, ninguno es de alta severidad por ahora.`
          : `De los ${total} issues detectados, ${data.summary.high_priority_issues} requieren atención prioritaria en el siguiente ciclo de mejoras.`,
    })
  }

  const mostAgreed = [...data.issues]
    .filter((issue) => issue.agreement_total > 1)
    .sort((a, b) => b.agreement_count / b.agreement_total - a.agreement_count / a.agreement_total)[0]
  if (mostAgreed && mostAgreed.agreement_count > 1) {
    insights.push({
      tone: "info",
      title: `${mostAgreed.agreement_count} de ${mostAgreed.agreement_total} evaluadores coinciden en un hallazgo`,
      body: `En "${mostAgreed.heuristic_name}", varios evaluadores identificaron el mismo problema de forma independiente, lo que aumenta la confianza en el hallazgo.`,
    })
  }

  insights.push({
    tone: "info",
    title: "Cobertura actual del análisis",
    body: `El análisis consolida ${data.summary.total_evaluations} evaluaciones (${data.summary.completed_evaluations} finalizadas), ${data.summary.evaluators_count} evaluadores y ${data.heuristics.length} heurísticas con datos. Los insights se actualizan al registrar nuevas evaluaciones.`,
  })

  return insights
}
