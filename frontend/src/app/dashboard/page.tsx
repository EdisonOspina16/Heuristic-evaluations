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
  Loader2
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
import { evaluationsService } from "@/features/evaluations/services/evaluations.service"
import { Plantilla } from "@/types/evaluations"

/**
 * Página de Dashboard principal.
 * Muestra el resumen de proyectos y permite iniciar nuevas evaluaciones.
 */
export default function DashboardPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await evaluationsService.getPlantillas()
        setPlantillas(data)
      } catch (err) {
        console.error("Error loading templates:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = [
    { label: "Plantillas Disponibles", value: plantillas.length.toString(), change: "Activas", icon: FileText },
    { label: "Evaluaciones Totales", value: "0", change: "+0", icon: CheckCircle2 },
    { label: "Promedio Global", value: "0.0", change: "N/A", icon: AlertCircle },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Bienvenido de nuevo. Aquí tienes las herramientas para tus evaluaciones de usabilidad.</p>
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
                <span className="text-emerald-500 font-medium">{stat.change}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Plantillas de Evaluación</h2>
          <Badge variant="outline" className="border-brand-500/20 text-brand-400">
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
              <Card key={plantilla.id} className="group relative overflow-hidden hover:bg-white/[0.03] transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <FileText className="w-12 h-12" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-brand-400 transition-colors">
                    {plantilla.nombre}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {plantilla.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/evaluacion/${plantilla.id}`}>
                    <Button variant="secondary" className="w-full group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      Comenzar Evaluación
                    </Button>
                  </Link>
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
                   <span className="text-sm text-zinc-200">Backend FastAPI</span>
                </div>
                <span className="text-xs text-emerald-500 font-medium">ONLINE</span>
             </div>
             <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-sm text-zinc-200">Base de Datos PostgreSQL</span>
                </div>
                <span className="text-xs text-emerald-500 font-medium">CONECTADA</span>
             </div>
          </CardContent>
        </Card>
        
        <Card className="bg-brand-600/5 border-brand-500/10">
          <CardHeader>
             <CardTitle className="text-lg text-brand-400">Guía de Uso</CardTitle>
             <CardDescription>Cómo empezar con la plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400 space-y-4">
             <p>1. Selecciona una plantilla de la lista superior.</p>
             <p>2. Completa los campos requeridos en el formulario dinámico.</p>
             <p>3. El sistema procesará automáticamente los promedios por dimensión y generará alertas si detecta problemas críticos de usabilidad.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
