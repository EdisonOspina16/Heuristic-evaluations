"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, AlertCircle, Info, Star } from "lucide-react"
import { Button } from "./ui/button"
import { Input, Textarea } from "./ui/input"
import { Badge } from "./ui/badge"

interface EvaluationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EvaluationModal({ isOpen, onClose }: EvaluationModalProps) {
  const [score, setScore] = useState(0)
  const [step, setStep] = useState(1)

  const heuristics = [
    "Visibilidad del estado del sistema",
    "Relación entre el sistema y el mundo real",
    "Control y libertad del usuario",
    "Consistencia y estándares",
    "Prevención de errores",
    "Reconocimiento antes que recuerdo",
    "Flexibilidad y eficiencia de uso",
    "Estética y diseño minimalista",
    "Ayudar a los usuarios a reconocer, diagnosticar y recuperarse de errores",
    "Ayuda y documentación"
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div>
                  <h2 className="text-xl font-bold text-white">Nueva Evaluación</h2>
                  <p className="text-sm text-zinc-500">Heurísticas de Nielsen • Paso {step} de 2</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {step === 1 ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-zinc-300">Selecciona la heurística a evaluar</label>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {heuristics.map((h, i) => (
                          <button
                            key={i}
                            className="text-left px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-brand-500/50 transition-all group"
                          >
                            <span className="text-sm text-zinc-400 group-hover:text-white">{h}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-sm font-medium text-zinc-300">Calificación de usabilidad</label>
                        <span className="text-2xl font-bold text-brand-400">{score || '-'} / 5</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setScore(val)}
                            className={`flex-1 h-16 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                              score === val 
                                ? 'bg-brand-600/20 border-brand-500 text-brand-400 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
                                : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/20'
                            }`}
                          >
                             <Star className={`w-5 h-5 ${score === val ? 'fill-current' : ''}`} />
                             <span className="text-xs font-bold">{val}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-600 uppercase tracking-widest px-1">
                        <span>Deficiente</span>
                        <span>Excelente</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-sm font-medium text-zinc-300">Observaciones cualitativas</label>
                       <Textarea 
                        placeholder="Describe los hallazgos encontrados..." 
                        className="min-h-[150px] bg-white/[0.01]"
                       />
                       <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                         <Info className="w-3 h-3" />
                         Sé específico sobre los puntos de fricción detectados.
                       </p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                       <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                       <div className="space-y-1">
                         <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Gravedad de la incidencia</p>
                         <p className="text-xs text-zinc-400">Si el puntaje es menor a 3, se recomienda proponer una solución inmediata.</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-between gap-4">
                <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(1)}>
                  {step === 1 ? 'Cancelar' : 'Atrás'}
                </Button>
                <div className="flex gap-3">
                  {step === 1 ? (
                    <Button 
                      disabled={!score} 
                      onClick={() => setStep(2)}
                      className="px-8"
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button 
                      className="px-8 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                      onClick={onClose}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Finalizar Evaluación
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
