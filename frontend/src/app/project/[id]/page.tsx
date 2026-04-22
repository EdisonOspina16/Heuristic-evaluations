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

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const projectId = params.id || "app-bancaria"

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
              Creado el 15 de Abril, 2026
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white capitalize">
            {projectId.replace(/-/g, ' ')}
          </h1>
          <p className="text-zinc-400 max-w-xl text-lg">
            Análisis heurístico enfocado en la experiencia del usuario para el flujo de transferencias y pagos en dispositivos móviles.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <Link href={`/project/${projectId}/evaluations`}>
            <Button className="gap-2 bg-brand-600 hover:bg-brand-500 shadow-xl shadow-brand-500/20">
              Ir a Evaluaciones <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="secondary" size="icon">
            <Settings className="w-4 h-4" />
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
            <CardDescription>Estado de las 10 heurísticas de Nielsen en este proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold text-white">84%</div>
              <div className="pb-1 text-sm text-emerald-500 font-medium">+4% desde la última semana</div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
                <span>Evaluaciones Completadas</span>
                <span>8 / 10 categorizadas</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
               <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Severidad Media</p>
                  <p className="text-sm font-semibold text-amber-500">Baja (1.2)</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Hallazgos</p>
                  <p className="text-sm font-semibold">24 totales</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Recomendaciones</p>
                  <p className="text-sm font-semibold">12 propuestas</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Iteraciones</p>
                  <p className="text-sm font-semibold text-emerald-500">V2 estable</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-zinc-400" />
              Evaluadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { name: "Edison Ospina", role: "Admin / Lead Designer", active: true },
                { name: "Sofia Cardona", role: "UX Researcher", active: false },
                { name: "Tomas Gomez", role: "UI Designer", active: true },
              ].map((member, i) => (
                <div key={i} className="flex items-center gap-3 group">
                   <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:border-brand-500/50 transition-colors">
                    {member.name.split(' ').map(n => n[0]).join('')}
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-zinc-500">{member.role}</p>
                   </div>
                   {member.active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full text-xs h-9 border-dashed">
              Gestionar Equipo
            </Button>
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
          <Link key={i} href={`/project/${projectId}/${item.href}`}>
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
