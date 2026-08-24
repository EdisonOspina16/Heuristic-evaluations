import type { ReactNode } from "react"

export function AnalyticsPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border border-border-subtle bg-bg-card ${className}`}>{children}</section>
}

export function AnalyticsFilter({
  children,
  active,
  onClick,
  color,
}: {
  children: ReactNode
  active: boolean
  onClick: () => void
  color?: string
}) {
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
