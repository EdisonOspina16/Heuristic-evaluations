"use client"

import React from 'react';
import { useEvaluation } from '../hooks/useEvaluation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle } from 'lucide-react';

/**
 * Componente de formulario dinámico que renderiza una plantilla de evaluación completa.
 * Organiza las preguntas por dimensiones y permite responder según el tipo (Likert o Selección).
 */
export const EvaluationForm: React.FC<EvaluationFormProps> = ({ 
  plantillaId, 
  projectId, 
  userId,
  onSuccess 
}) => {
  const { plantilla, loading, error, respuestas, updateRespuesta, submit } = useEvaluation(plantillaId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit(projectId, userId);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !plantilla) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;
  if (!plantilla) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{plantilla.nombre}</h1>
        <p className="text-zinc-500">{plantilla.descripcion}</p>
      </div>

      {plantilla.dimensiones.map((dimension) => (
        <section key={dimension.id} className="space-y-6">
          <h2 className="text-xl font-semibold text-brand-400 border-b border-white/10 pb-2">
            {dimension.nombre}
          </h2>
          
          <div className="space-y-8">
            {dimension.preguntas.map((pregunta) => (
              <Card key={pregunta.id} className="bg-white/[0.02] border-white/5">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-lg text-white font-medium">{pregunta.texto}</p>
                    {pregunta.texto_en && (
                      <p className="text-sm text-zinc-500 italic">{pregunta.texto_en}</p>
                    )}
                  </div>

                  {/* Render based on type */}
                  <div className="flex flex-wrap gap-4">
                    {pregunta.tipo_respuesta.startsWith('likert') ? (
                      <RadioGroup 
                        onValueChange={(val) => updateRespuesta(pregunta.id, { valor_numerico: parseInt(val) })}
                        className="flex flex-wrap gap-6"
                      >
                        {Array.from({ length: pregunta.tipo_respuesta === 'likert_5' ? 5 : 9 }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <RadioGroupItem 
                              value={(i + 1).toString()} 
                              id={`p${pregunta.id}-${i+1}`}
                              className="w-6 h-6"
                            />
                            <Label htmlFor={`p${pregunta.id}-${i+1}`} className="text-xs text-zinc-400">
                              {i + 1}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <RadioGroup 
                        onValueChange={(val) => updateRespuesta(pregunta.id, { opcion_id: parseInt(val) })}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full"
                      >
                        {pregunta.opciones.map((opcion) => (
                          <div 
                            key={opcion.id} 
                            className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                          >
                            <RadioGroupItem value={opcion.id.toString()} id={`op${opcion.id}`} />
                            <Label htmlFor={`op${opcion.id}`} className="flex-1 cursor-pointer text-sm text-zinc-300">
                              {opcion.etiqueta}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500 uppercase">Comentarios / Observaciones</Label>
                    <Textarea 
                      placeholder="Agrega detalles adicionales..."
                      className="bg-black/20 border-white/5 resize-none h-20"
                      onChange={(e) => updateRespuesta(pregunta.id, { comentario: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-8 flex justify-end">
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
