import { useState, useEffect, useCallback } from 'react';
import { evaluationsService } from '../services/evaluations.service';
import { PlantillaEstructura, EvaluacionCreate, RespuestaCreate } from '@/types/evaluations';

/**
 * Hook personalizado para manejar el estado de una evaluación heurística.
 * Carga la estructura de la plantilla, maneja el estado de cada respuesta y envía el payload.
 * 
 * @param plantillaId - ID de la plantilla a cargar inicialmente
 */
export const useEvaluation = (plantillaId?: number, evaluationId?: number) => {
  const [plantilla, setPlantilla] = useState<PlantillaEstructura | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaCreate>>({});
  const [draftEvaluationId, setDraftEvaluationId] = useState<number | undefined>(evaluationId);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const loadPlantilla = useCallback(async (id: number, existingEvaluationId?: number) => {
    setLoading(true);
    try {
      const data = await evaluationsService.getEstructura(id);
      setPlantilla(data);
      
      // Initialize answers
      const initialRespuestas: Record<number, RespuestaCreate> = {};
      data.dimensiones.forEach(dim => {
        dim.preguntas.forEach(pre => {
          initialRespuestas[pre.id] = {
            pregunta_id: pre.id,
            valor_numerico: undefined,
            opcion_id: undefined,
            comentario: ''
          };
        });
      });
      if (existingEvaluationId) {
        const progress = await evaluationsService.getProgress(existingEvaluationId);
        progress.respuestas.forEach(resp => {
          initialRespuestas[resp.pregunta_id] = {
            ...initialRespuestas[resp.pregunta_id],
            ...resp,
          };
        });
        setDraftEvaluationId(progress.evaluation_id);
      }
      setRespuestas(initialRespuestas);
    } catch (err: any) {
      setError(err.message || 'Error loading template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (plantillaId) {
      loadPlantilla(plantillaId, evaluationId);
    }
  }, [plantillaId, evaluationId, loadPlantilla]);

  const updateRespuesta = (preguntaId: number, data: Partial<RespuestaCreate>) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: { ...prev[preguntaId], ...data }
    }));
  };

  const saveProgress = useCallback(async (projectId: number, userId: number) => {
    if (!plantilla || !projectId || !userId) return;
    const result = await evaluationsService.saveProgress({
      evaluation_id: draftEvaluationId,
      plantilla_id: plantilla.id,
      proyecto_id: projectId,
      evaluador_id: userId,
      respuestas: Object.values(respuestas)
    });
    setDraftEvaluationId(result.id);
    setLastSavedAt(new Date());
    return result;
  }, [draftEvaluationId, plantilla, respuestas]);

  const submit = async (projectId: number, userId: number, perfil?: string, estudios?: string) => {
    if (!plantilla) return;
    
    const payload: EvaluacionCreate = {
      plantilla_id: plantilla.id,
      proyecto_id: projectId,
      evaluador_id: userId,
      evaluation_id: draftEvaluationId,
      perfil,
      estudios,
      respuestas: Object.values(respuestas)
    };

    setLoading(true);
    try {
      const result = await evaluationsService.submitEvaluacion(payload);
      return result;
    } catch (err: any) {
      setError(err.message || 'Error submitting evaluation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    plantilla,
    loading,
    error,
    respuestas,
    draftEvaluationId,
    lastSavedAt,
    updateRespuesta,
    saveProgress,
    submit
  };
};
