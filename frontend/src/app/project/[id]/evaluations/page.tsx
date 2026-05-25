"use client"

import React, { useState } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  Target, 
  Loader2,
  AlertCircle,
  PlayCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"

import { useParams } from "next/navigation"
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { projectsService } from "@/features/projects/services/projects.service"

export default function EvaluationsPage() {
  const params = useParams()
  const projectId = params.id as string
  const [searchTerm, setSearchTerm] = useState("")
  const [evalList, setEvalList] = useState<any[]>([])
  const [projectName, setProjectName] = useState("")
  const [loading, setLoading] = useState(true)
  const [openActionId, setOpenActionId] = useState<number | null>(null)

  const getDisplayStatus = (ev: any) => {
    const progress = ev.progress_percentage || 0
    if (progress >= 100) return "Completada"
    if (ev.estado === "borrador") return "En progreso"
    return "Incompleta"
  }

  const getStatusVariant = (ev: any) => {
    const progress = ev.progress_percentage || 0
    if (progress >= 100) return "success"
    return "warning"
  }

  React.useEffect(() => {
    const fetchData = async () => {
      const numericId = parseInt(projectId)
      if (isNaN(numericId)) {
        console.error("Invalid project ID:", projectId)
        setLoading(false)
        return
      }

      try {
        const [proj, evals] = await Promise.all([
          projectsService.getProject(numericId),
          evaluationsService.getEvaluationsByProject(numericId)
        ])
        setProjectName(proj.nombre)
        setEvalList(evals)
      } catch (err) {
        console.error("Error fetching evaluations", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    )
  }

  const filteredEvals = evalList.filter(ev => 
    ev.plantilla_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.perfil?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">
            <Target className="w-3 h-3" />
            Proyecto: {projectName}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Evaluaciones</h1>
        </div>
        <Link href="/dashboard">
          <Button className="gap-2 shadow-lg shadow-brand-500/20">
            <Plus className="w-4 h-4" />
            Nueva Evaluación
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Buscar por heurística o ID..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3 h-3" /> Filtros
          </Button>
          <Button variant="outline" size="sm">Exportar</Button>
        </div>
      </div>

      {/* Evaluations Table/List */}
      <Card className="overflow-hidden bg-white/[0.01] border-white/5">
        <div className="overflow-x-auto">
          {filteredEvals.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Heurística</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Progreso</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvals.map((ev) => (
                  <tr key={ev.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-zinc-500">#{ev.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                          {ev.plantilla_nombre || "Evaluación Heurística"}
                        </span>
                        <span className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
                          Perfil: {ev.perfil} | {ev.estudios}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(ev)}>
                        {getDisplayStatus(ev)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-40">
                        <div className="h-2 flex-1 rounded-full bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${ev.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-10 text-right">{ev.progress_percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-white"
                          onClick={() => setOpenActionId(openActionId === ev.id ? null : ev.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {openActionId === ev.id && (
                          <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                            <Link
                              href={`/evaluacion/${ev.plantilla_id}?project_id=${projectId}&evaluation_id=${ev.id}`}
                              className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              <PlayCircle className="w-4 h-4 text-brand-400" />
                              {ev.estado === "borrador" ? "Continuar evaluación" : "Editar evaluación"}
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-zinc-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">No hay evaluaciones registradas</p>
                <p className="text-zinc-500 text-sm">Aún no has realizado evaluaciones para este proyecto.</p>
              </div>
              <Link href="/dashboard" className="inline-block pt-2">
                <Button className="bg-brand-600 hover:bg-brand-500 text-white">
                  Comenzar primera evaluación
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
