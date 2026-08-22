"use client"

import React from "react"
import axios from "axios"
import { useParams } from "next/navigation"
import { Save, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { authService } from "@/features/auth/services/auth.service"
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { projectsService } from "@/features/projects/services/projects.service"
import { Plantilla } from "@/types/evaluations"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function ProjectAssignmentsPage() {
  const params = useParams()
  const projectId = parseInt(params.id as string)
  const [users, setUsers] = React.useState<any[]>([])
  const [plantillas, setPlantillas] = React.useState<Plantilla[]>([])
  const [assignments, setAssignments] = React.useState<Record<number, any>>({})
  const [loading, setLoading] = React.useState(true)
  const [savingId, setSavingId] = React.useState<number | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const token = authService.getToken()
        const [usersResponse, templatesResponse, assignmentsResponse] = await Promise.all([
          axios.get(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } }),
          evaluationsService.getPlantillas(),
          projectsService.getAssignments(projectId)
        ])
        setUsers(usersResponse.data.filter((user: any) => user.roles?.some((role: any) => role.name === "EVALUADOR")))
        setPlantillas(templatesResponse)
        setAssignments(Object.fromEntries(assignmentsResponse.map((item: any) => [item.evaluator_id, item])))
      } catch (error) {
        console.error("Error loading assignments", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [projectId])

  const toggleTemplate = (userId: number, templateName: string) => {
    const current = assignments[userId]?.allowed_evaluation_types || []
    const next = current.includes(templateName)
      ? current.filter((name: string) => name !== templateName)
      : [...current, templateName]
    setAssignments(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        evaluator_id: userId,
        role: prev[userId]?.role || "General",
        allowed_evaluation_types: next
      }
    }))
  }

  const saveAssignment = async (userId: number) => {
    const assignment = assignments[userId] || { evaluator_id: userId, role: "General", allowed_evaluation_types: [] }
    setSavingId(userId)
    try {
      const saved = await projectsService.saveAssignment(projectId, assignment)
      setAssignments(prev => ({ ...prev, [userId]: saved }))
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al guardar asignación")
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-accent-brand" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-accent-brand" />
          Asignar Evaluadores
        </h1>
        <p className="text-subtle mt-1">Define qué evaluador trabajará cada tipo de evaluación del proyecto.</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {users.map(user => {
          const assignment = assignments[user.id] || { role: "General", allowed_evaluation_types: [] }
          return (
            <Card key={user.id} className="bg-surface-tint border-border-subtle">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{user.nombre}</CardTitle>
                  <p className="text-sm text-subtle">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="Enfoque: UI, UX, Accesibilidad..."
                    value={assignment.role || ""}
                    onChange={(event) => setAssignments(prev => ({
                      ...prev,
                      [user.id]: { ...(prev[user.id] || {}), evaluator_id: user.id, role: event.target.value }
                    }))}
                  />
                  <Button onClick={() => saveAssignment(user.id)} disabled={savingId === user.id} className="gap-2">
                    {savingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {plantillas.map(template => {
                  const selected = assignment.allowed_evaluation_types?.includes(template.nombre)
                  return (
                    <Badge
                      key={template.id}
                      onClick={() => toggleTemplate(user.id, template.nombre)}
                      className={`cursor-pointer border px-3 py-1 ${
                        selected
                          ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                          : "bg-bg-elevated text-muted border-border-subtle"
                      }`}
                    >
                      {template.nombre}
                    </Badge>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
