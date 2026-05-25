"use client"

import React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark")

  React.useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null
    const preferred = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    setTheme(preferred)
    document.documentElement.classList.toggle("light", preferred === "light")
    document.documentElement.classList.toggle("dark", preferred === "dark")
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("theme", next)
    document.documentElement.classList.toggle("light", next === "light")
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} title="Cambiar tema" className="h-8 w-8">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
