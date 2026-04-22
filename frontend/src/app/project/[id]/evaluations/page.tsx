"use client"

import React, { useState } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  Target, 
  MessageSquare,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const evaluations = [
  {
    id: "EV-102",
    heuristic: "Visibilidad del estado del sistema",
    score: 4,
    author: "Edison Ospina",
    date: "Abr 21, 2026",
    status: "Completed",
    observations: "El feedback visual es claro pero el tiempo de respuesta es lento."
  },
  {
    id: "EV-101",
    heuristic: "Consistencia y estándares",
    score: 2,
    author: "Edison Ospina",
    date: "Abr 20, 2026",
    status: "Needs Review",
    observations: "Se usan diferentes colores para el mismo tipo de alerta en distintas pantallas."
  },
  {
    id: "EV-100",
    heuristic: "Prevención de errores",
    score: 5,
    author: "Edison Ospina",
    date: "Abr 19, 2026",
    status: "Completed",
    observations: "Excelente manejo de confirmaciones en acciones destructivas."
  },
]

import { EvaluationModal } from "@/components/evaluation-modal"

export default function EvaluationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">
            <Target className="w-3 h-3" />
            Proyecto: App Bancaria
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Evaluaciones</h1>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Nueva Evaluación
        </Button>
      </div>

      <EvaluationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Heurística</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Puntaje</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {evaluations.map((ev) => (
                <tr key={ev.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-zinc-500">{ev.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">
                        {ev.heuristic}
                      </span>
                      <span className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
                        {ev.observations}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div 
                          key={s} 
                          className={`w-1.5 h-1.5 rounded-full ${s <= ev.score ? 'bg-brand-500' : 'bg-zinc-800'}`} 
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium">{ev.score}/5</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={ev.status === 'Completed' ? 'success' : 'warning'}>
                      {ev.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      {ev.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State / Footer Information */}
      <div className="flex justify-between items-center text-xs text-zinc-500 pt-4">
        <p>Mostrando 3 de 40 evaluaciones realizadas.</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled>Anterior</Button>
          <Button variant="ghost" size="sm">Siguiente</Button>
        </div>
      </div>
    </div>
  )
}
