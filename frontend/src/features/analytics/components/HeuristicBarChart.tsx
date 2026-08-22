"use client"

import { Bar } from "react-chartjs-2"
import "../chartSetup"
import { HeuristicBreakdown, Severity } from "../types"
import { SEVERITY_COLORS, SEVERITY_LABELS, themeVar } from "../colors"

const SEVERITIES: Severity[] = ["high", "medium", "low"]

export function HeuristicBarChart({ heuristics }: { heuristics: HeuristicBreakdown[] }) {
  if (!heuristics.length) {
    return <p className="py-8 text-center text-[13px] text-subtle">No hay datos por heurística todavía.</p>
  }

  const data = {
    labels: heuristics.map((h) => h.name),
    datasets: SEVERITIES.map((severity) => ({
      label: SEVERITY_LABELS[severity],
      data: heuristics.map((h) => h[severity]),
      backgroundColor: SEVERITY_COLORS[severity],
      borderRadius: 3,
      maxBarThickness: 14,
    })),
  }

  const subtleColor = themeVar("--color-subtle", "#5f6580")
  const mutedColor = themeVar("--color-muted", "#8b91a8")
  const foregroundColor = themeVar("--color-foreground", "#eef0f6")
  const elevatedColor = themeVar("--color-bg-elevated", "#1c1f2b")
  const borderColor = themeVar("--color-border-subtle", "rgba(255,255,255,0.07)")
  const gridColor = themeVar("--color-surface-tint", "rgba(255,255,255,0.04)")

  return (
    <div style={{ height: Math.max(220, heuristics.length * 34) }}>
      <Bar
        data={data}
        options={{
          indexAxis: "y" as const,
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, beginAtZero: true, ticks: { color: subtleColor, font: { size: 10 }, precision: 0 }, grid: { color: gridColor } },
            y: { stacked: true, ticks: { color: mutedColor, font: { size: 11 } }, grid: { display: false } },
          },
          plugins: {
            legend: { position: "bottom", labels: { color: mutedColor, boxWidth: 10, font: { size: 11 } } },
            tooltip: { backgroundColor: elevatedColor, borderColor, borderWidth: 1, bodyColor: foregroundColor, titleColor: mutedColor },
          },
        }}
      />
    </div>
  )
}
