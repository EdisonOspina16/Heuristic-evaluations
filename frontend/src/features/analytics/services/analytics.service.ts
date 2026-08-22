import api from '@/lib/api';
import { ProjectAnalyticsResponse, ProjectSummaryCard } from '../types';

/**
 * Servicio del módulo de analíticas. Consume los endpoints agregados del
 * backend (backend/analytics) en vez de calcular métricas en el cliente.
 */
export const analyticsService = {
  getProjectsSummary: async (): Promise<ProjectSummaryCard[]> => {
    const response = await api.get('/analytics/projects');
    return response.data;
  },

  getProjectAnalytics: async (projectId: number): Promise<ProjectAnalyticsResponse> => {
    const response = await api.get(`/analytics/projects/${projectId}`);
    return response.data;
  },
};
