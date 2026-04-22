"use client"

import React from "react"
import { 
  Plus, 
  ArrowUpRight, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const projects = [
  {
    id: 1,
    name: "App Bancaria",
    description: "Evaluación de usabilidad para el flujo de transferencias.",
    status: "In Progress",
    progress: 65,
    lastUpdate: "2h ago",
    evaluations: 12,
  },
  {
    id: 2,
    name: "E-commerce Redesign",
    description: "Optimización del checkout y carrito de compras.",
    status: "Completed",
    progress: 100,
    lastUpdate: "1d ago",
    evaluations: 24,
  },
  {
    id: 3,
    name: "Landing Page Saas",
    description: "Evaluación heurística de la landing principal.",
    status: "Pending",
    progress: 15,
    lastUpdate: "5h ago",
    evaluations: 4,
  },
]

const stats = [
  { label: "Proyectos Activos", value: "3", change: "+12%", icon: Clock },
  { label: "Evaluaciones Totales", value: "40", change: "+5", icon: CheckCircle2 },
  { label: "Promedio Global", value: "4.2", change: "+0.3", icon: AlertCircle },
]

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Bienvenido de nuevo, Edison. Aquí tienes un resumen de tus evaluaciones.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white/[0.01]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {stat.label}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-zinc-500 mt-1">
                <span className="text-emerald-500 font-medium">{stat.change}</span> respecto al mes pasado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Proyectos Recientes</h2>
          <Button variant="ghost" size="sm" className="text-brand-400 hover:text-brand-300">
            Ver todos <ArrowUpRight className="ml-1 w-3 h-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group cursor-pointer hover:bg-white/[0.03]">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                   <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg group-hover:text-brand-400 transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-500">Progreso</span>
                    <span className="text-white">{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-600 rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    Actualizado hace {project.lastUpdate}
                  </div>
                  <div className="text-xs font-medium text-white">
                    {project.evaluations} <span className="text-zinc-500">evals</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Section: Recent Activity / Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
            <CardDescription>Eventos clave en tus proyectos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { text: "Nueva evaluación completada en App Bancaria", time: "2h ago", type: "eval" },
              { text: "Edison Ospina creó el proyecto E-commerce", time: "5h ago", type: "proj" },
              { text: "Reporte mensual generado satisfactoriamente", time: "1d ago", type: "report" },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full mt-1.5 bg-brand-500" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{activity.text}</p>
                  <p className="text-xs text-zinc-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="bg-brand-600/5 border-brand-500/10">
          <CardHeader>
             <CardTitle className="text-lg text-brand-400">Próximos Pasos</CardTitle>
             <CardDescription>Recomendaciones heurísticas para ti.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-sm font-medium text-white">Revisar heurísticas de Nielsen</p>
                <p className="text-xs text-zinc-400">El proyecto Landing Page tiene 4 evaluaciones pendientes por categorizar.</p>
                <Button variant="secondary" size="sm" className="mt-2">Empezar ahora</Button>
             </div>
             <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-sm font-medium text-white">Generar reporte de KPIs</p>
                <p className="text-xs text-zinc-400">Has alcanzado el límite de 40 evaluaciones. Es un buen momento para exportar.</p>
                <Button variant="outline" size="sm" className="mt-2">Generar PDF</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
