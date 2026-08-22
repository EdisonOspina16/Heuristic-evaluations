"use client"

import { Doughnut } from "react-chartjs-2"
import "../chartSetup"
import { SeverityCounts } from "../types"
import { SEVERITY_COLORS, SEVERITY_LABELS, themeVar } from "../colors"

export function SeverityDonutChart({ severity }: { severity: SeverityCounts }) {
  const total = severity.high + severity.medium + severity.low
  if (total === 0) {
    return <p className="py-8 text-center text-[13px] text-subtle">No hay issues registrados.</p>
  }

  const data = {
    labels: [SEVERITY_LABELS.high, SEVERITY_LABELS.medium, SEVERITY_LABELS.low],
    datasets: [
      {
        data: [severity.high, severity.medium, severity.low],
        backgroundColor: [SEVERITY_COLORS.high, SEVERITY_COLORS.medium, SEVERITY_COLORS.low],
        borderColor: themeVar("--color-bg-card", "#161920"),
        borderWidth: 2,
      },
    ],
  }

  const mutedColor = themeVar("--color-muted", "#8b91a8")
  const foregroundColor = themeVar("--color-foreground", "#eef0f6")
  const elevatedColor = themeVar("--color-bg-elevated", "#1c1f2b")
  const borderColor = themeVar("--color-border-subtle", "rgba(255,255,255,0.07)")

  return (
    <div className="relative h-[190px]">
      <Doughnut
        data={data}
        options={{
          cutout: "68%",
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: mutedColor, boxWidth: 10, padding: 12, font: { size: 11 } } },
            tooltip: { backgroundColor: elevatedColor, borderColor, borderWidth: 1, bodyColor: foregroundColor, titleColor: mutedColor },
          },
        }}
      />
    </div>
  )
}
