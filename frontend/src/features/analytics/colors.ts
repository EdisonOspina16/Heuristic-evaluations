import { Severity } from './types';

export const SEVERITY_COLORS: Record<Severity, string> = {
  high: '#f43f5e',
  medium: '#fb923c',
  low: '#fbbf24',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export const STATUS_COLORS: Record<string, string> = {
  Good: '#34d399',
  Fair: '#6366f1',
  'Needs work': '#fb923c',
  Poor: '#f97316',
  Critical: '#f43f5e',
  'Sin datos': '#5f6580',
};

export const ACCENT = '#6366f1';

/**
 * Lee un token de tema (definido en globals.css) resuelto en el momento del
 * render. Chart.js no acepta variables CSS directamente en sus opciones, así
 * que los gráficos leen el valor calculado para adaptarse a claro/oscuro.
 */
export function themeVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
