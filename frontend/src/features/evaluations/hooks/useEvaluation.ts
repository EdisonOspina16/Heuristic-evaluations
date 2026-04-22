import { useState, useEffect } from 'react';
import { evaluationsService } from '../services/evaluations.service';
import { PlantillaEstructura, EvaluacionCreate, RespuestaCreate } from '@/types/evaluations';

/**
 * Hook personalizado para manejar el estado de una evaluación heurística.
 * Carga la estructura de la plantilla, maneja el estado de cada respuesta y envía el payload.
 * 
 * @param plantillaId - ID de la plantilla a cargar inicialmente
 */
export const useEvaluation = (plantillaId?: number) => {
  const [plantilla, setPlantilla] = useState<PlantillaEstructura | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaCreate>>({});

  useEffect(() => {
    if (plantillaId) {
      loadPlantilla(plantillaId);
    }
  }, [plantillaId]);

  const loadPlantilla = async (id: number) => {
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
      setRespuestas(initialRespuestas);
    } catch (err: any) {
      setError(err.message || 'Error loading template');
    } finally {
      setLoading(false);
    }
  };

  const updateRespuesta = (preguntaId: number, data: Partial<RespuestaCreate>) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: { ...prev[preguntaId], ...data }
    }));
  };

  const submit = async (projectId: number, userId: number, perfil?: string, estudios?: string) => {
    if (!plantilla) return;
    
    const payload: EvaluacionCreate = {
      plantilla_id: plantilla.id,
      proyecto_id: projectId,
      evaluador_id: userId,
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
    updateRespuesta,
    submit
  };
};
