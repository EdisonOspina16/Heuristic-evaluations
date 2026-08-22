"use client"

import React from 'react';
import { useEvaluation } from '../hooks/useEvaluation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, Save } from 'lucide-react';

interface EvaluationFormProps {
  plantillaId: number;
  projectId: number;
  userId: number;
  evaluationId?: number;
  onSuccess?: () => void;
}

/**
 * Componente de formulario dinámico que renderiza una plantilla de evaluación completa.
 * Organiza las preguntas por dimensiones y permite responder según el tipo (Likert o Selección).
 */
export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  plantillaId,
  projectId,
  userId,
  evaluationId,
  onSuccess
}) => {
  const { plantilla, loading, error, respuestas, updateRespuesta, submit, saveProgress, lastSavedAt } = useEvaluation(plantillaId, evaluationId);
  const [saving, setSaving] = React.useState(false);
  const didHydrate = React.useRef(false);

  const totalQuestions = React.useMemo(
    () => plantilla?.dimensiones.reduce((total, dimension) => total + dimension.preguntas.length, 0) || 0,
    [plantilla]
  );

  const answeredQuestions = React.useMemo(
    () => Object.values(respuestas).filter((respuesta) => (
      respuesta.valor_numerico !== undefined ||
      respuesta.opcion_id !== undefined ||
      Boolean(respuesta.comentario?.trim())
    )).length,
    [respuestas]
  );

  const progressPercent = totalQuestions ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const showSaveProgress = progressPercent < 95;

  React.useEffect(() => {
    if (!plantilla || !Object.keys(respuestas).length) return;
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSaving(true);
      try {
        await saveProgress(projectId, userId);
      } catch (err) {
        console.error("Error saving evaluation progress", err);
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [respuestas, plantilla, projectId, userId, saveProgress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit(projectId, userId);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSave = async () => {
    setSaving(true);
    try {
      await saveProgress(projectId, userId);
    } catch (err) {
      console.error("Error saving evaluation progress", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !plantilla) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) return <div data-cy="error-message" className="text-red-500 p-8">Error: {error}</div>;
  if (!plantilla) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{plantilla.nombre}</h1>
        <p className="text-subtle">{plantilla.descripcion}</p>

        {/* ── Progress indicators ── */}
        <div
          data-cy="progress-bar"
          role="progressbar"
          aria-label={`Progreso de evaluación ${progressPercent}%`}
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-1.5 bg-surface-tint rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div data-cy="progress-count" className="text-xs text-subtle">
          {answeredQuestions} / {totalQuestions}
        </div>

        <div className="flex items-center gap-2 text-xs text-subtle">
          <Save className="w-3 h-3" />
          {saving ? "Guardando progreso..." : lastSavedAt ? `Progreso guardado ${lastSavedAt.toLocaleTimeString()}` : "El progreso se guarda automáticamente"}
        </div>
      </div>

      {plantilla.dimensiones.map((dimension) => (
        <section key={dimension.id} className="space-y-6">
          {/* data-cy used by tests that count/read dimension headings */}
          <h2
            data-cy="dimension-title"
            className="text-xl font-semibold text-accent-brand border-b border-border-subtle pb-2"
          >
            {dimension.nombre}
          </h2>

          <div className="space-y-8">
            {dimension.preguntas.map((pregunta) => (
              <Card key={pregunta.id} className="bg-surface-tint border-border-subtle">
                <CardContent className="pt-6 space-y-6">
                  {/*
                    Hidden input per question — single source of truth for test selectors.
                    data-cy="respuesta-input-{id}" covers both:
                      • [data-cy^="respuesta-input-"]  → generic count assertion
                      • [data-cy=respuesta-input-101]  → specific value assertion after hydration
                    value mirrors valor_numerico (likert) or opcion_id (selección) as a string.
                  */}
                  <input
                    type="hidden"
                    data-cy={`respuesta-input-${pregunta.id}`}
                    value={
                      respuestas[pregunta.id]?.valor_numerico !== undefined
                        ? String(respuestas[pregunta.id].valor_numerico)
                        : respuestas[pregunta.id]?.opcion_id !== undefined
                          ? String(respuestas[pregunta.id].opcion_id)
                          : ""
                    }
                    readOnly
                  />

                  <div className="space-y-2">
                    <p className="text-lg text-foreground font-medium">{pregunta.texto}</p>
                    {pregunta.texto_en && (
                      <p className="text-sm text-subtle italic">{pregunta.texto_en}</p>
                    )}
                  </div>

                  {/* Render based on type */}
                  <div className="flex flex-wrap gap-4">
                    {pregunta.tipo_respuesta.startsWith('likert') ? (
                      <div className="flex flex-wrap gap-6">
                        {Array.from({ length: pregunta.tipo_respuesta === 'likert_5' ? 5 : 9 }).map((_, i) => {
                          const val = i + 1;
                          const isSelected = respuestas[pregunta.id]?.valor_numerico === val;
                          return (
                            <div
                              key={i}
                              className="flex flex-col items-center gap-2 cursor-pointer group"
                              onClick={() => {
                                if (isSelected) {
                                  updateRespuesta(pregunta.id, { valor_numerico: undefined });
                                } else {
                                  updateRespuesta(pregunta.id, { valor_numerico: val });
                                }
                              }}
                            >
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected
                                ? "border-brand-500 bg-brand-500/20"
                                : "border-border-subtle group-hover:border-border-hover"
                                }`}>
                                {isSelected && <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />}
                              </div>
                              <span className={`text-xs transition-colors ${isSelected ? "text-accent-brand font-bold" : "text-subtle group-hover:text-muted"}`}>
                                {val}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        {pregunta.opciones.map((opcion) => {
                          const isSelected = respuestas[pregunta.id]?.opcion_id === opcion.id;
                          return (
                            <div
                              key={opcion.id}
                              onClick={() => {
                                if (isSelected) {
                                  updateRespuesta(pregunta.id, { opcion_id: undefined });
                                } else {
                                  updateRespuesta(pregunta.id, { opcion_id: opcion.id });
                                }
                              }}
                              className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${isSelected
                                ? "border-brand-500/50 bg-brand-500/10 shadow-lg shadow-brand-500/5"
                                : "border-border-subtle bg-surface-tint hover:bg-surface-tint hover:border-border-subtle"
                                }`}
                            >
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? "border-brand-500" : "border-border-subtle"
                                }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                              </div>
                              <span className={`flex-1 text-sm transition-colors ${isSelected ? "text-accent-brand font-medium" : "text-muted"}`}>
                                {opcion.etiqueta}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-subtle uppercase">Comentarios / Observaciones</Label>
                    <Textarea
                      placeholder="Agrega detalles adicionales..."
                      className="bg-surface-tint border-border-subtle resize-none h-20"
                      value={respuestas[pregunta.id]?.comentario || ""}
                      onChange={(e) => updateRespuesta(pregunta.id, { comentario: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-8 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={loading || saving}
          onClick={handleManualSave}
          className={`px-6 py-6 text-lg bg-surface-tint/90 backdrop-blur border-border-subtle transition-all duration-500 ${showSaveProgress
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
            }`}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Guardar progreso
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="shadow-2xl shadow-brand-500/20 px-8 py-6 text-lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          Finalizar Evaluación
        </Button>
      </div>
    </form>
  );
};