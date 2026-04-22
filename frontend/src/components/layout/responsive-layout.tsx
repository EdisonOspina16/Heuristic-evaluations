"use client"

import React, { useState, useEffect } from "react"
import { Menu, FolderKanban } from "lucide-react"
import { Sidebar } from "./sidebar"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"

/**
 * Layout principal responsivo que incluye el Sidebar lateral y el área de contenido.
 * Maneja el estado de apertura/cierre del menú en dispositivos móviles.
 */
export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (pathname === "/login" || pathname === "/register") {
      setIsCheckingAuth(false)
    } else if (!token) {
      router.push("/login")
    } else {
      setIsCheckingAuth(false)
    }
  }, [pathname, router])

  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>
  }

  if (isCheckingAuth) {
    // Return empty state or loading spinner to avoid flash of unprotected content
    return <div className="min-h-screen bg-bg-deep flex items-center justify-center"></div>
  }

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">
      {/* Mobile Top Bar */}
      <header className="lg:hidden h-14 border-b border-white/5 bg-bg-sidebar px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">HeuristicApp</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Sidebar (Responsive Toggle) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
