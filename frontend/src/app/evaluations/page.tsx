"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, Layers, ListChecks, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { projectsService, Project } from "@/features/projects/services/projects.service"
import { authService } from "@/features/auth/services/auth.service"
import { Plantilla, PlantillaEstructura } from "@/types/evaluations"

type PlantillaConEstructura = Plantilla & { dimensiones: number; preguntas: number }

const ESCALAS: Record<string, string> = {
  likert_5: "Escala 1-5",
  likert_9: "Escala 1-9",
  categorico: "Checklist heurístico",
}

export default function EvaluationsPage() {
  const router = useRouter()
  const [plantillas, setPlantillas] = useState<PlantillaConEstructura[]>([])
  const [escalasPorPlantilla, setEscalasPorPlantilla] = useState<Record<number, string>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [assignmentsByProject, setAssignmentsByProject] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  useEffect(() => {
    async function load() {
      try {
        const [templatesData, projectsData] = await Promise.all([
          evaluationsService.getPlantillas(),
          projectsService.getProjects(),
        ])
        const [estructuras, assignmentPairs] = await Promise.all([
          Promise.all(templatesData.map((p) => evaluationsService.getEstructura(p.id).catch(() => null))),
          Promise.all(
            projectsData.map((project) =>
              projectsService
                .getAssignments(project.id)
                .then((items) => [project.id, items] as const)
                .catch(() => [project.id, []] as const)
            )
          ),
        ])
        const escalas: Record<number, string> = {}
        const withCounts: PlantillaConEstructura[] = templatesData.map((plantilla, index) => {
          const estructura = estructuras[index] as PlantillaEstructura | null
          const dimensiones = estructura?.dimensiones ?? []
          const totalPreguntas = dimensiones.reduce((sum, d) => sum + d.preguntas.length, 0)
          const primerTipo = dimensiones.flatMap((d) => d.preguntas)[0]?.tipo_respuesta
          if (primerTipo) escalas[plantilla.id] = ESCALAS[primerTipo] || primerTipo
          return { ...plantilla, dimensiones: dimensiones.length, preguntas: totalPreguntas }
        })
        setPlantillas(withCounts)
        setEscalasPorPlantilla(escalas)
        setProjects(projectsData)
        setAssignmentsByProject(Object.fromEntries(assignmentPairs))
      } catch (err) {
        console.error("Error loading evaluations page:", err)
        setError("No se pudieron cargar las plantillas de evaluación.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleStartEval = (plantilla: Plantilla) => {
    setSelectedPlantilla(plantilla)
    setSelectedProjectId("")
    setIsEvalModalOpen(true)
  }

  const confirmStartEval = () => {
    if (!selectedProjectId || !selectedPlantilla) return
    router.push(`/evaluacion/${selectedPlantilla.id}?project_id=${selectedProjectId}`)
  }

  const currentUser = authService.getCurrentUser()
  const selectedProjectAssignments = selectedProjectId ? assignmentsByProject[parseInt(selectedProjectId)] || [] : []
  const currentAssignment = selectedProjectAssignments.find((item) => item.evaluator_id === currentUser?.id)
  const allowedTypes: string[] = currentAssignment?.allowed_evaluation_types || []
  const isSelectedTemplateAllowed =
    !selectedPlantilla || allowedTypes.length === 0 || allowedTypes.includes(selectedPlantilla.nombre) || authService.can("MANAGE_USERS")

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
          <ClipboardCheck className="w-3.5 h-3.5 text-accent-brand" /> Evaluaciones
        </div>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">Plantillas disponibles</h1>
        <p className="mt-1 text-subtle max-w-2xl">
          Cada plantilla mide algo distinto de la experiencia de usuario. Elige la que corresponda a lo que quieres evaluar y
          comienza directamente desde aquí — solo verás habilitado el proyecto donde tengas permiso para usarla.
        </p>
      </div>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plantillas.map((plantilla) => (
            <Card key={plantilla.id} className="flex flex-col hover:bg-surface-tint transition-all">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{plantilla.codigo}</Badge>
                </div>
                <CardDescription className="leading-5">{plantilla.descripcion}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-muted">
                    <Layers className="w-3 h-3" /> {plantilla.dimensiones} dimensiones
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-muted">
                    <ListChecks className="w-3 h-3" /> {plantilla.preguntas} preguntas
                  </span>
                  {escalasPorPlantilla[plantilla.id] && (
                    <Badge variant="outline">{escalasPorPlantilla[plantilla.id]}</Badge>
                  )}
                </div>
                <Button
                  variant="secondary"
                  className="w-full hover:bg-brand-600 hover:text-white transition-colors"
                  onClick={() => handleStartEval(plantilla)}
                >
                  Comenzar evaluación
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEvalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEvalModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-elevated border border-border-subtle rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-subtle">
                <h2 className="text-xl font-bold text-foreground">Iniciar evaluación</h2>
                <p className="text-sm text-subtle">
                  Selecciona el proyecto al que pertenecerá esta evaluación de{" "}
                  <span className="text-accent-brand font-semibold">{selectedPlantilla?.nombre}</span>.
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Seleccionar proyecto</label>
                  {projects.length > 0 ? (
                    <select
                      className="w-full bg-surface-tint border border-border-subtle rounded-xl p-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">-- Elige un proyecto --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.cliente ? `(${p.cliente})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <p className="text-sm text-red-400">No tienes proyectos creados.</p>
                    </div>
                  )}
                </div>
                {!isSelectedTemplateAllowed && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
                    Esta plantilla no está asignada a tu enfoque en este proyecto.
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setIsEvalModalOpen(false)} className="flex-1 rounded-xl text-muted hover:text-foreground">
                    Cancelar
                  </Button>
                  <Button
                    disabled={!selectedProjectId || !isSelectedTemplateAllowed}
                    onClick={confirmStartEval}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/20"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
