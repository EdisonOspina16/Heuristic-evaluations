import * as React from "react"
import { cn } from "./button"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'danger' | 'warning'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-brand-500/10 text-accent-brand border-brand-500/20',
    secondary: 'bg-surface-tint text-muted border-border-subtle',
    outline: 'border-border-subtle text-foreground',
    success: 'bg-emerald-500/10 text-accent-emerald border-emerald-500/20',
    danger: 'bg-red-500/10 text-accent-rose border-red-500/20',
    warning: 'bg-amber-500/10 text-accent-amber border-amber-500/20',
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
