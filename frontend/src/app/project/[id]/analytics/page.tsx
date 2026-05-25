"use client"

import React from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight,
  Info
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const barData = [
  { name: 'Visibilidad', value: 4.2 },
  { name: 'Realidad', value: 3.8 },
  { name: 'Control', value: 3.5 },
  { name: 'Consistencia', value: 2.8 },
  { name: 'Prevención', value: 4.5 },
  { name: 'Reconocimiento', value: 4.0 },
]

const radarData = [
  { subject: 'Visibilidad', A: 120, fullMark: 150 },
  { subject: 'Consistencia', A: 98, fullMark: 150 },
  { subject: 'Flexibilidad', A: 86, fullMark: 150 },
  { subject: 'Estética', A: 99, fullMark: 150 },
  { subject: 'Error', A: 85, fullMark: 150 },
  { subject: 'Ayuda', A: 65, fullMark: 150 },
]

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">
            <Target className="w-3 h-3" />
            Análisis de Datos
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Analíticas Heurísticas</h1>
        </div>
        <div className="flex gap-3">
           <Badge variant="outline" className="py-1.5 px-4 bg-brand-500/5">ID: App Bancaria</Badge>
           <Badge variant="success" className="py-1.5 px-4">Salud: 84%</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Puntaje Medio", value: "3.9", sub: "+0.2 pts", icon: TrendingUp, color: "text-emerald-500" },
          { label: "Alertas Críticas", value: "3", sub: "-2 esta semana", icon: AlertTriangle, color: "text-red-500" },
          { label: "Heurística Top", value: "Prevención", sub: "Score: 4.5", icon: Target, color: "text-brand-400" },
          { label: "Bajo Desempeño", value: "Consistencia", sub: "Score: 2.8", icon: Info, color: "text-amber-500" },
        ].map((kpi, i) => (
          <Card key={i} className="bg-white/[0.01]">
            <CardContent className="p-6">
               <div className="flex justify-between items-start">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
               </div>
               <div className="mt-3">
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className={`text-[10px] font-medium mt-1 ${kpi.color}`}>{kpi.sub}</p>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart - Average per Heuristic */}
        <Card className="bg-white/[0.01]">
          <CardHeader>
            <CardTitle>Promedio por Heurística</CardTitle>
            <CardDescription>Escala de 1 a 5 basado en todas las evaluaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#525252" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#71717a' }}
                  />
                  <YAxis 
                    stroke="#525252" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 5]}
                    tick={{ fill: '#71717a' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#8b5cf6', fontSize: '12px' }}
                    labelStyle={{ color: '#fff', marginBottom: '4px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.value < 3 ? '#ef4444' : entry.value < 4 ? '#f59e0b' : '#8b5cf6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart - Global Footprint */}
        <Card className="bg-white/[0.01]">
          <CardHeader>
            <CardTitle>Evaluación Global</CardTitle>
            <CardDescription>Visualización del cumplimiento por categorías.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
               <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="Evaluación A"
                    dataKey="A"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card className="bg-white/[0.01]">
        <CardHeader>
          <CardTitle>Insights y Observaciones</CardTitle>
          <CardDescription>Acciones recomendadas basadas en los datos actuales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02]">
             <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
               <ArrowDownRight className="w-5 h-5 text-red-500" />
             </div>
             <div>
               <p className="text-sm font-bold text-red-500">Urgente: Consistencia tipográfica</p>
               <p className="text-xs text-zinc-400 mt-1">Se han detectado variaciones en el uso de fuentes y tamaños en el checkout. Esto afecta la confianza del usuario.</p>
             </div>
          </div>
          <div className="flex gap-4 p-4 rounded-xl border border-brand-500/10 bg-brand-500/[0.02]">
             <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
               <ArrowUpRight className="w-5 h-5 text-brand-500" />
             </div>
             <div>
               <p className="text-sm font-bold text-brand-400">Excelente: Prevención de errores</p>
               <p className="text-xs text-zinc-400 mt-1">El sistema de validación en tiempo real ha mejorado el puntaje de esta categoría en un 15%.</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
