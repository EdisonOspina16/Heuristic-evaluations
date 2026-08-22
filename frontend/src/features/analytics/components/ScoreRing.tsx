"use client"

import { useEffect, useState } from "react"
import { STATUS_COLORS, themeVar } from "../colors"

const SIZE = 128
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreRing({ score, status }: { score: number | null; status: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(score ?? 0))
    return () => cancelAnimationFrame(frame)
  }, [score])

  const color = STATUS_COLORS[status] || STATUS_COLORS["Sin datos"]
  const trackColor = themeVar("--color-border-subtle", "rgba(255,255,255,0.06)")
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={trackColor} strokeWidth={STROKE} fill="none" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-3xl font-medium text-foreground">{score === null ? "—" : score}</span>
        <span className="mt-0.5 text-center text-[10px] uppercase tracking-[0.06em] text-subtle">{status}</span>
      </div>
    </div>
  )
}
