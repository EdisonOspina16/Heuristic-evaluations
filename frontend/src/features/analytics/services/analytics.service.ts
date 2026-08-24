import api from '@/lib/api';
import { authService } from '@/features/auth/services/auth.service';
import { ProjectAnalyticsResponse, ProjectSummaryCard } from '../types';

export type AiInsightsStreamEvent =
  | { type: 'start'; model?: string }
  | { type: 'token'; text: string }
  | { type: 'done'; ok: boolean }
  | { type: 'error'; message: string };

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

  streamProjectAiInsights: async (
    projectId: number,
    onEvent: (event: AiInsightsStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const token = authService.getToken();
    const baseUrl = api.defaults.baseURL;
    const response = await fetch(
      `${baseUrl}/analytics/projects/${projectId}/ai-insights/stream`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal,
      },
    );

    if (!response.ok) {
      throw new Error(`No se pudieron generar los insights (${response.status})`);
    }
    if (!response.body) {
      throw new Error('El servidor no devolvió un stream de insights');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const consumeEvent = (rawEvent: string) => {
      const lines = rawEvent.split(/\r?\n/);
      const eventName = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
      const data = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');

      if (!eventName || !data) return;

      const parsed = JSON.parse(data) as Record<string, unknown>;
      if (eventName === 'token' && typeof parsed.text === 'string') {
        onEvent({ type: 'token', text: parsed.text });
      } else if (eventName === 'start') {
        onEvent({ type: 'start', model: typeof parsed.model === 'string' ? parsed.model : undefined });
      } else if (eventName === 'done') {
        onEvent({ type: 'done', ok: parsed.ok === true });
      } else if (eventName === 'error') {
        onEvent({ type: 'error', message: typeof parsed.message === 'string' ? parsed.message : 'Error generando insights' });
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';
      events.forEach(consumeEvent);

      if (done) {
        if (buffer.trim()) consumeEvent(buffer);
        break;
      }
    }
  },
};
