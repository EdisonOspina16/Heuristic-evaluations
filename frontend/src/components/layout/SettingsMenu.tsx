"use client"

import * as React from "react"
import { Moon, Settings, Sun, Type } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, Button } from "@/components/ui/button"
import {
  FONT_SCALES,
  FontScaleKey,
  ThemeMode,
  getStoredFontScale,
  getStoredTheme,
  setFontScale as persistFontScale,
  setTheme as persistTheme,
} from "@/lib/appearance"

export function SettingsMenu() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [theme, setThemeState] = React.useState<ThemeMode>("dark")
  const [fontScale, setFontScaleState] = React.useState<FontScaleKey>("md")
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setThemeState(getStoredTheme())
    setFontScaleState(getStoredFontScale())
  }, [])

  React.useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [isOpen])

  const chooseTheme = (next: ThemeMode) => {
    setThemeState(next)
    persistTheme(next)
  }

  const chooseFontScale = (next: FontScaleKey) => {
    setFontScaleState(next)
    persistFontScale(next)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Configuración"
        aria-label="Configuración"
        onClick={() => setIsOpen((v) => !v)}
      >
        <Settings className="h-4 w-4" />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border-subtle bg-bg-elevated shadow-2xl z-[70] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-sm font-semibold text-foreground">Configuración general</p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                  {theme === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />} Tema
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => chooseTheme("light")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                      theme === "light" ? "border-brand-500/40 bg-brand-500/10 text-accent-brand" : "border-border-subtle text-muted hover:text-foreground"
                    )}
                  >
                    <Sun className="h-3.5 w-3.5" /> Claro
                  </button>
                  <button
                    onClick={() => chooseTheme("dark")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                      theme === "dark" ? "border-brand-500/40 bg-brand-500/10 text-accent-brand" : "border-border-subtle text-muted hover:text-foreground"
                    )}
                  >
                    <Moon className="h-3.5 w-3.5" /> Oscuro
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                  <Type className="h-3 w-3" /> Tamaño de letra
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(FONT_SCALES) as FontScaleKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => chooseFontScale(key)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm transition-colors",
                        fontScale === key ? "border-brand-500/40 bg-brand-500/10 text-accent-brand" : "border-border-subtle text-muted hover:text-foreground"
                      )}
                    >
                      {FONT_SCALES[key].label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-4 text-subtle">
                  Ajusta el tamaño del texto en toda la aplicación. Útil por accesibilidad.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
