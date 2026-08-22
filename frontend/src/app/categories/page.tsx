"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Hash, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/components/ui/button"
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { PlantillaEstructura } from "@/types/evaluations"

export default function CategoriesPage() {
  const [plantillas, setPlantillas] = useState<PlantillaEstructura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    async function load() {
      try {
        const list = await evaluationsService.getPlantillas()
        const estructuras = await Promise.all(list.map((p) => evaluationsService.getEstructura(p.id)))
        setPlantillas(estructuras)
      } catch (err) {
        console.error("Error loading categories page:", err)
        setError("No se pudieron cargar las categorías de evaluación.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggle = (dimensionId: number) => setExpanded((prev) => ({ ...prev, [dimensionId]: !prev[dimensionId] }))

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
          <Hash className="w-3.5 h-3.5 text-accent-brand" /> Categorías
        </div>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">Qué mide cada categoría</h1>
        <p className="mt-1 text-subtle max-w-2xl">
          Cada plantilla se divide en dimensiones (categorías) y cada una agrupa las preguntas que la componen. Úsalo como
          referencia para saber exactamente qué evalúa cada parte antes de responder o de interpretar un resultado.
        </p>
      </div>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {plantillas.map((plantilla) => (
            <Card key={plantilla.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{plantilla.dimensiones.length} categorías</Badge>
                </div>
                <CardDescription>{plantilla.descripcion}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {plantilla.dimensiones.length === 0 ? (
                  <p className="text-sm text-subtle italic">Esta plantilla todavía no tiene preguntas configuradas.</p>
                ) : (
                  plantilla.dimensiones.map((dimension) => {
                    const isOpen = !!expanded[dimension.id]
                    return (
                      <div key={dimension.id} className="rounded-xl border border-border-subtle overflow-hidden">
                        <button
                          onClick={() => toggle(dimension.id)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-tint transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground">{dimension.nombre}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-subtle">{dimension.preguntas.length} preguntas</span>
                            <ChevronDown className={cn("w-4 h-4 text-subtle transition-transform", isOpen && "rotate-180")} />
                          </div>
                        </button>
                        {isOpen && (
                          <ul className="border-t border-border-subtle bg-surface-tint px-4 py-3 space-y-2">
                            {dimension.preguntas.map((pregunta) => (
                              <li key={pregunta.id} className="text-sm text-muted leading-5">
                                {pregunta.texto}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
