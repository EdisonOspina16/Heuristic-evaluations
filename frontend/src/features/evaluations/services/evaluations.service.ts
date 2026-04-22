import api from '@/lib/api';
import { Plantilla, PlantillaEstructura, EvaluacionCreate } from '@/types/evaluations';

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
  }
};
