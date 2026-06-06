"use client"

import React from "react"
import {
  BarChart3,
  ClipboardCheck,
  Settings,
  Users,
  Calendar,
  ArrowRight,
  TrendingUp,
  Layout
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { projectsService, Project, ProjectAssignment } from "@/features/projects/services/projects.service"
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { authService } from "@/features/auth/services/auth.service"
import { Loader2 } from "lucide-react"

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [project, setProject] = React.useState<Project | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [evaluations, setEvaluations] = React.useState<any[]>([])
  const [assignments, setAssignments] = React.useState<ProjectAssignment[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      const numericId = parseInt(id)
      if (isNaN(numericId)) {
        console.error("Invalid project ID:", id)
        setLoading(false)
        return
      }

      try {
        const [projData, evalsData, assignmentsData] = await Promise.all([
          projectsService.getProject(numericId),
          evaluationsService.getEvaluationsByProject(numericId),
          projectsService.getAssignments(numericId)
        ])
        setProject(projData)
        setEvaluations(evalsData)
        setAssignments(assignmentsData)
      } catch (err) {
        console.error("Error fetching project data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    )
  }

  if (!project) return <div>Proyecto no encontrado</div>

  const evaluators = assignments.map((assignment) => ({
    name: assignment.evaluator_name || "Evaluador",
    email: assignment.evaluator_email,
    role: assignment.role || "General",
    types: assignment.allowed_evaluation_types || [],
    active: true
  }))

  // Calculate progress (e.g., 10 evaluations target)
  const goal = 10
  const progressPercent = Math.min(Math.round((evaluations.length / goal) * 100), 100)
  const canManageTeam = authService.can("MANAGE_USERS")

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/[0.01] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] -mr-32 -mt-32" />

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20">
              Activo
            </Badge>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Creado el {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white capitalize">
            {project.nombre}
          </h1>
          <p className="text-zinc-400 max-w-xl text-lg">
            {project.descripcion || "Sin descripción disponible."}
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <Link href={`/project/${project.id}/evaluations`}>
            <Button className="gap-2 bg-brand-600 hover:bg-brand-500 shadow-xl shadow-brand-500/20">
              Ir a Evaluaciones <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="secondary" size="icon">
            <Link href={`/project/${project.id}/assignments`}>
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Progress Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Progreso General
            </CardTitle>
            <CardDescription>Evaluaciones completadas frente al objetivo del proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold text-white">{progressPercent}%</div>
              <div className="pb-1 text-sm text-zinc-500 font-medium">del objetivo de {goal} evaluaciones</div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
                <span>Estado de Avance</span>
                <span>{evaluations.length} / {goal} completadas</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Evaluaciones</p>
                <p className="text-sm font-semibold">{evaluations.length} realizadas</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Estado</p>
                <p className={`text-sm font-semibold ${evaluations.length > 0 ? "text-emerald-500" : "text-amber-500"}`}>
                  {evaluations.length > 0 ? "En progreso" : "Pendiente"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Última Actividad</p>
                <p className="text-sm font-semibold">
                  {evaluations.length > 0 ? new Date(evaluations[0].fecha).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Iteración</p>
                <p className="text-sm font-semibold text-zinc-400">V1.0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-zinc-400" />
              Equipo Evaluador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {evaluators.length > 0 ? evaluators.map((member, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:border-brand-500/50 transition-colors">
                    {(member.name || member.email || "E").split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-zinc-500">{member.role}</p>
                    {member.types.length > 0 && (
                      <p className="text-[10px] text-zinc-600 truncate max-w-56 mt-0.5">
                        {member.types.join(" · ")}
                      </p>
                    )}
                  </div>
                  {member.active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
              )) : (
                <p className="text-xs text-zinc-500 italic py-4">No hay evaluadores registrados aún.</p>
              )}
            </div>
            {canManageTeam && (
              <Button variant="outline" className="w-full text-xs h-9 border-dashed">
                <Link href={`/project/${project.id}/assignments`}>Gestionar Equipo</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Evaluaciones", desc: "Registro histórico", icon: ClipboardCheck, href: "evaluations", color: "bg-blue-500/10 text-blue-400" },
          { title: "Analíticas", desc: "Gráficos y KPIs", icon: BarChart3, href: "analytics", color: "bg-purple-500/10 text-purple-400" },
          { title: "Categorías", desc: "Configura heurísticas", icon: Layout, href: "categories", color: "bg-amber-500/10 text-amber-400" },
          { title: "Reportes", desc: "Exportar hallazgos", icon: Calendar, href: "reports", color: "bg-emerald-500/10 text-emerald-400" },
        ].map((item, i) => (
          <Link key={i} href={`/project/${project.id}/${item.href}`}>
            <Card className="hover:bg-white/[0.03] active:scale-[0.98] transition-all group">
              <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm group-hover:text-brand-400 transition-colors">{item.title}</CardTitle>
                  <CardDescription className="text-[10px]">{item.desc}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
