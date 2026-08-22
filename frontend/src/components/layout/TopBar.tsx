"use client"

import * as React from "react"
import Link from "next/link"
import { HelpCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsMenu } from "./SettingsMenu"
import { authService, User as UserType } from "@/features/auth/services/auth.service"

/**
 * Clúster de acciones globales arriba a la derecha (ayuda, configuración,
 * perfil), visible en toda la app en desktop y mobile.
 */
export function TopBar() {
  const [user, setUser] = React.useState<UserType | null>(null)

  React.useEffect(() => {
    setUser(authService.getCurrentUser())
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      <Link href="/help">
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Ayuda" aria-label="Ayuda">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </Link>
      <SettingsMenu />
      <Link href="/account" title={user?.nombre || "Mi cuenta"} aria-label="Mi cuenta">
        <div className="h-8 w-8 rounded-full bg-surface-tint border border-border-subtle flex items-center justify-center hover:border-brand-500/40 transition-colors">
          <User className="h-4 w-4 text-muted" />
        </div>
      </Link>
    </div>
  )
}
