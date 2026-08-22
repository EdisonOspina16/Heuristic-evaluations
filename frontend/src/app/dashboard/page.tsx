"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Plus, 
  ArrowUpRight, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Loader2,
  FolderKanban
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { projectsService, Project } from "@/features/projects/services/projects.service"
import { authService } from "@/features/auth/services/auth.service"
import { Plantilla } from "@/types/evaluations"
import { motion, AnimatePresence } from "framer-motion"

export default function DashboardPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [assignmentsByProject, setAssignmentsByProject] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)
  
  // Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newProject, setNewProject] = useState({
    nombre: "",
    descripcion: "",
    cliente: ""
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesData, projectsData] = await Promise.all([
          evaluationsService.getPlantillas(),
          projectsService.getProjects()
        ])
        const [evaluationsByProject, assignmentPairs] = await Promise.all([
          Promise.all(projectsData.map(project => evaluationsService.getEvaluationsByProject(project.id).catch(() => []))),
          Promise.all(projectsData.map(project => projectsService.getAssignments(project.id).then(items => [project.id, items] as const).catch(() => [project.id, []] as const)))
        ])
        setPlantillas(templatesData)
        setProjects(projectsData)
        setEvaluations(evaluationsByProject.flat())
        setAssignmentsByProject(Object.fromEntries(assignmentPairs))
      } catch (err) {
        console.error("Error loading dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const created = await projectsService.createProject(newProject)
      setProjects([...projects, created])
      setIsModalOpen(false)
      setNewProject({ nombre: "", descripcion: "", cliente: "" })
    } catch (err) {
      alert("Error al crear proyecto")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Evaluation Start State
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const router = useRouter()

  const handleStartEval = (plantilla: Plantilla) => {
    setSelectedPlantilla(plantilla)
    setIsEvalModalOpen(true)
  }

  const confirmStartEval = () => {
    if (!selectedProjectId || !selectedPlantilla) return
    router.push(`/evaluacion/${selectedPlantilla.id}?project_id=${selectedProjectId}`)
  }

  const currentUser = authService.getCurrentUser()
  const selectedProjectAssignments = selectedProjectId ? assignmentsByProject[parseInt(selectedProjectId)] || [] : []
  const currentAssignment = selectedProjectAssignments.find(item => item.evaluator_id === currentUser?.id)
  const allowedTypes = currentAssignment?.allowed_evaluation_types || []
  const isSelectedTemplateAllowed = !selectedPlantilla || allowedTypes.length === 0 || allowedTypes.includes(selectedPlantilla.nombre) || authService.can("MANAGE_USERS")
  const recurrentTypes = Object.entries(
    evaluations.reduce((acc: Record<string, number>, ev) => {
      const key = ev.plantilla_nombre || "Evaluación Heurística"
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const stats = [
    { label: "Plantillas Disponibles", value: plantillas.length.toString(), change: "Activas", icon: FileText },
    { label: "Proyectos Activos", value: projects.length.toString(), change: `+${projects.length}`, icon: FolderKanban },
    { label: "Evaluaciones Totales", value: evaluations.length.toString(), change: `${evaluations.filter(ev => ev.estado === "borrador").length} en progreso`, icon: CheckCircle2 },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-subtle mt-1">Bienvenido de nuevo. Aquí tienes las herramientas para tus evaluaciones de usabilidad.</p>
        </div>
        {authService.can("CREATE_PROJECTS") && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </Button>
        )}
      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-bg-elevated border border-border-subtle rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-subtle">
                <h2 className="text-xl font-bold text-foreground">Nuevo Proyecto</h2>
                <p className="text-sm text-subtle">Define un espacio de trabajo para tus evaluaciones.</p>
              </div>
              <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Nombre del Proyecto</label>
                  <input 
                    required
                    placeholder="Ej: Rediseño App Móvil"
                    className="w-full bg-surface-tint border border-border-subtle rounded-xl p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-500/20"
                    value={newProject.nombre}
                    onChange={(e) => setNewProject({...newProject, nombre: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Cliente / Empresa</label>
                  <input 
                    placeholder="Ej: Banco Global"
                    className="w-full bg-surface-tint border border-border-subtle rounded-xl p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-500/20"
                    value={newProject.cliente}
                    onChange={(e) => setNewProject({...newProject, cliente: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Descripción</label>
                  <textarea 
                    rows={3}
                    placeholder="Breve descripción del alcance..."
                    className="w-full bg-surface-tint border border-border-subtle rounded-xl p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                    value={newProject.descripcion}
                    onChange={(e) => setNewProject({...newProject, descripcion: e.target.value})}
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl text-muted hover:text-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/20"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Proyecto"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Select Project Modal for Evaluation */}
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
                <h2 className="text-xl font-bold text-foreground">Iniciar Evaluación</h2>
                <p className="text-sm text-subtle">
                  Selecciona el proyecto al que pertenecerá esta evaluación de <span className="text-accent-brand font-semibold">{selectedPlantilla?.nombre}</span>.
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted uppercase">Seleccionar Proyecto</label>
                  {projects.length > 0 ? (
                    <select 
                      className="w-full bg-surface-tint border border-border-subtle rounded-xl p-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">-- Elige un proyecto --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} {p.cliente ? `(${p.cliente})` : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <p className="text-sm text-red-400">No tienes proyectos creados.</p>
                      <Button 
                        variant="ghost" 
                        className="text-accent-brand text-xs mt-1"
                        onClick={() => {
                          setIsEvalModalOpen(false);
                          setIsModalOpen(true);
                        }}
                      >
                        Crear primer proyecto ahora
                      </Button>
                    </div>
                  )}
                </div>
                {!isSelectedTemplateAllowed && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
                    Esta plantilla no está asignada a tu enfoque en este proyecto.
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsEvalModalOpen(false)}
                    className="flex-1 rounded-xl text-muted hover:text-foreground"
                  >
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-surface-tint">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-subtle uppercase tracking-wider">
                {stat.label}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-subtle" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-subtle mt-1">
                <span className="text-emerald-500 font-medium">{stat.change}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates Section */}
      {recurrentTypes.length > 0 && (
        <Card className="bg-surface-tint border-border-subtle">
          <CardHeader>
            <CardTitle className="text-lg">Tipos de evaluación más recurrentes</CardTitle>
            <CardDescription>Frecuencia calculada con las evaluaciones registradas en tus proyectos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {recurrentTypes.map(([name, count]) => (
              <Badge key={name} className="bg-brand-500/10 text-brand-300 border border-brand-500/20 px-3 py-1">
                {name}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Templates Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Plantillas de Evaluación</h2>
          <Badge variant="outline" className="border-brand-500/20 text-accent-brand">
            {loading ? "Cargando..." : "Listas para usar"}
          </Badge>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plantillas.map((plantilla) => (
              <Card key={plantilla.id} className="group relative overflow-hidden hover:bg-surface-tint transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <FileText className="w-12 h-12" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-accent-brand transition-colors">
                    {plantilla.nombre}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {plantilla.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="secondary" 
                    className="w-full group-hover:bg-brand-600 group-hover:text-white transition-colors"
                    onClick={() => handleStartEval(plantilla)}
                  >
                    Comenzar Evaluación
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del Sistema</CardTitle>
            <CardDescription>Estado de la arquitectura backend y base de datos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-sm text-foreground">Backend FastAPI</span>
                </div>
                <span className="text-xs text-emerald-500 font-medium">ONLINE</span>
             </div>
             <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-sm text-foreground">Base de Datos PostgreSQL</span>
                </div>
                <span className="text-xs text-emerald-500 font-medium">CONECTADA</span>
             </div>
          </CardContent>
        </Card>
        
        <Card className="bg-brand-600/5 border-brand-500/10">
          <CardHeader>
             <CardTitle className="text-lg text-accent-brand">Guía de Uso</CardTitle>
             <CardDescription>Cómo empezar con la plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted space-y-4">
             <p>1. Selecciona una plantilla de la lista superior.</p>
             <p>2. Completa los campos requeridos en el formulario dinámico.</p>
             <p>3. El sistema procesará automáticamente los promedios por dimensión y generará alertas si detecta problemas críticos de usabilidad.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
