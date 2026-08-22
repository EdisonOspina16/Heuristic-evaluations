import { buildInsights } from './insights';
import { ProjectAnalyticsResponse } from '../types';

function makeData(overrides: Partial<ProjectAnalyticsResponse> = {}): ProjectAnalyticsResponse {
  return {
    project: { id: 1, nombre: 'Proyecto Demo' },
    has_data: true,
    summary: {
      ux_score: 60,
      status: 'Needs work',
      total_evaluations: 3,
      completed_evaluations: 2,
      evaluators_count: 2,
      total_issues: 4,
      high_priority_issues: 2,
      avg_issues_per_evaluator: 2,
    },
    severity_breakdown: { high: 2, medium: 1, low: 1 },
    heuristics: [
      { dimension_id: 1, name: 'Visibilidad', average: 1.2, high: 2, medium: 0, low: 0 },
      { dimension_id: 2, name: 'Consistencia', average: 2.5, high: 0, medium: 1, low: 1 },
    ],
    issues: [
      { id: '1-1', dimension_id: 1, heuristic_name: 'Visibilidad', severity: 'high', description: 'Botón invisible', evaluator_name: 'Ana', evaluation_id: 1, agreement_count: 2, agreement_total: 2 },
      { id: '2-1', dimension_id: 1, heuristic_name: 'Visibilidad', severity: 'high', description: 'Botón invisible', evaluator_name: 'Beto', evaluation_id: 2, agreement_count: 2, agreement_total: 2 },
    ],
    evaluators: [],
    timeline: [],
    ...overrides,
  };
}

describe('buildInsights', () => {
  it('identifica la heurística con más issues ponderados', () => {
    const insights = buildInsights(makeData());
    expect(insights[0].title).toContain('Visibilidad');
    expect(insights[0].tone).toBe('critical');
  });

  it('calcula la densidad de issues de severidad alta', () => {
    const insights = buildInsights(makeData());
    const densityInsight = insights.find((i) => i.title.includes('severidad alta'));
    expect(densityInsight?.title).toContain('50%');
  });

  it('destaca el hallazgo con mayor acuerdo entre evaluadores', () => {
    const insights = buildInsights(makeData());
    const agreementInsight = insights.find((i) => i.title.includes('evaluadores coinciden'));
    expect(agreementInsight?.title).toContain('2 de 2');
  });

  it('siempre incluye el resumen de cobertura al final', () => {
    const insights = buildInsights(makeData());
    expect(insights[insights.length - 1].title).toBe('Cobertura actual del análisis');
  });

  it('no revienta cuando no hay heurísticas ni issues', () => {
    const insights = buildInsights(makeData({ heuristics: [], issues: [], summary: { ...makeData().summary, total_issues: 0, high_priority_issues: 0 } }));
    expect(insights).toHaveLength(1);
    expect(insights[0].title).toBe('Cobertura actual del análisis');
  });
});
