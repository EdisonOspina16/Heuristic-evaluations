"use client"

import { Line } from "react-chartjs-2"
import type { ScriptableContext } from "chart.js"
import "../chartSetup"
import { TimelinePoint } from "../types"
import { ACCENT, themeVar } from "../colors"

export function TimelineChart({ timeline }: { timeline: TimelinePoint[] }) {
  if (timeline.length < 2) {
    return <p className="py-8 text-center text-[13px] text-subtle">Se requieren dos evaluaciones con resultados para mostrar una tendencia.</p>
  }

  const subtleColor = themeVar("--color-subtle", "#5f6580")
  const mutedColor = themeVar("--color-muted", "#8b91a8")
  const elevatedColor = themeVar("--color-bg-elevated", "#1c1f2b")
  const borderColor = themeVar("--color-border-subtle", "rgba(255,255,255,0.07)")
  const gridColor = themeVar("--color-surface-tint", "rgba(255,255,255,0.04)")
  const accentColor = themeVar("--color-accent-indigo", ACCENT)

  const data = {
    labels: timeline.map((point) => point.label),
    datasets: [
      {
        label: "Promedio normalizado",
        data: timeline.map((point) => point.average),
        borderColor: ACCENT,
        backgroundColor: (context: ScriptableContext<"line">) => {
          const { ctx, chartArea } = context.chart
          if (!chartArea) return "rgba(99,102,241,0.15)"
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, "rgba(99,102,241,0.32)")
          gradient.addColorStop(1, "rgba(99,102,241,0)")
          return gradient
        },
        fill: true,
        tension: 0.35,
        pointRadius: 3.5,
        pointBackgroundColor: ACCENT,
        pointBorderWidth: 0,
      },
    ],
  }

  return (
    <div className="h-[170px]">
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { display: false }, ticks: { color: subtleColor, font: { size: 11 } } },
            y: { grid: { color: gridColor }, ticks: { color: subtleColor, font: { size: 11 } }, suggestedMin: 0, suggestedMax: 100 },
          },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: elevatedColor, borderColor, borderWidth: 1, titleColor: mutedColor, bodyColor: accentColor },
          },
        }}
      />
    </div>
  )
}
