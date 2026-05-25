import api from '@/lib/api';
import { Plantilla, PlantillaEstructura, EvaluacionCreate, EvaluationProgress, RespuestaCreate } from '@/types/evaluations';

/**
 * Servicio encargado de gestionar las plantillas y el envío de evaluaciones.
 * Se comunica directamente con los endpoints del backend utilizando Axios.
 */
export const evaluationsService = {
  getPlantillas: async (): Promise<Plantilla[]> => {
    const response = await api.get('/plantillas/');
    return response.data;
  },

  getEstructura: async (id: number): Promise<PlantillaEstructura> => {
    const response = await api.get(`/plantillas/${id}/estructura`);
    return response.data;
  },

  submitEvaluacion: async (data: EvaluacionCreate) => {
    const response = await api.post('/evaluaciones/', data);
    return response.data;
  },

  saveProgress: async (data: {
    evaluation_id?: number;
    plantilla_id: number;
    proyecto_id: number;
    evaluador_id: number;
    respuestas: RespuestaCreate[];
  }) => {
    const response = await api.patch('/evaluaciones/progress', data);
    return response.data;
  },

  getProgress: async (evaluationId: number): Promise<EvaluationProgress> => {
    const response = await api.get(`/evaluaciones/progress/${evaluationId}`);
    return response.data;
  },

  getEvaluationsByProject: async (projectId: number): Promise<any[]> => {
    const response = await api.get(`/evaluaciones/proyecto/${projectId}`);
    return response.data;
  }
};
