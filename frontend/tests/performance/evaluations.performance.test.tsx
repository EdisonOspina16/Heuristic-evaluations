import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EvaluationForm } from "@/features/evaluations/components/EvaluationForm";
import { evaluationsService } from "@/features/evaluations/services/evaluations.service";

jest.mock("@/features/evaluations/services/evaluations.service", () => ({
  evaluationsService: {
    getEstructura: jest.fn(),
    getProgress: jest.fn(),
    saveProgress: jest.fn(),
    submitEvaluacion: jest.fn(),
  },
}));

const mockedEvaluationsService = evaluationsService as jest.Mocked<
  typeof evaluationsService
>;

function makePlantilla(questionCount: number, dimensionCount = 5) {
  let questionId = 1;
  return {
    id: 1,
    codigo: "HEURISTIC_PERF",
    nombre: `Plantilla ${questionCount}`,
    descripcion: "Plantilla de performance para evaluaciones heuristicas",
    version: 1,
    activa: true,
    dimensiones: Array.from({ length: dimensionCount }, (_, dimensionIndex) => ({
      id: dimensionIndex + 1,
      nombre: `Dimension ${dimensionIndex + 1}`,
      orden: dimensionIndex + 1,
      preguntas: Array.from(
        { length: Math.ceil(questionCount / dimensionCount) },
        (_, questionIndex) => {
          if (questionId > questionCount) return null;
          const id = questionId++;
          return {
            id,
            texto: `Pregunta ${id}`,
            texto_en: null,
            orden: questionIndex + 1,
            tipo_respuesta: "likert_5",
            opciones: [],
          };
        },
      ).filter(Boolean),

    })),
  };
}

function answerVisibleLikertQuestions(limit: number, value = "4") {
  screen
    .getAllByText(value)
    .slice(0, limit)
    .forEach((option) => fireEvent.click(option));

}

describe("Evaluation engine frontend performance smoke tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEvaluationsService.saveProgress.mockResolvedValue({
      id: 99,
      estado: "borrador",
    });

    mockedEvaluationsService.submitEvaluacion.mockResolvedValue({
      id: 100,
      estado: "completada",
    });
  });

  test("renderiza una plantilla pequena bajo un umbral razonable", async () => {
    mockedEvaluationsService.getEstructura.mockResolvedValueOnce(
      makePlantilla(5, 1),
    );

    const startedAt = performance.now();
    render(<EvaluationForm plantillaId={1} projectId={10} userId={5} />);
    await screen.findByText("Pregunta 5");
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(500);
    expect(screen.getByText("0 / 5")).toBeInTheDocument();
  });

  test("renderiza una plantilla grande bajo un umbral razonable", async () => {
    mockedEvaluationsService.getEstructura.mockResolvedValueOnce(
      makePlantilla(50, 5),
    );

    const startedAt = performance.now();
    render(<EvaluationForm plantillaId={1} projectId={10} userId={5} />);
    await screen.findByText("Pregunta 50");
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(1200);
    expect(screen.getByText("0 / 50")).toBeInTheDocument();
  });

  test("renderiza 100 preguntas bajo un umbral razonable", async () => {
    mockedEvaluationsService.getEstructura.mockResolvedValueOnce(
      makePlantilla(100, 10),
    );

    const startedAt = performance.now();
    render(<EvaluationForm plantillaId={1} projectId={10} userId={5} />);
    await screen.findByText("Pregunta 100");
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(2000);
    expect(screen.getByText("0 / 100")).toBeInTheDocument();
  });

  test("renderiza 500 preguntas bajo un umbral razonable", async () => {
    mockedEvaluationsService.getEstructura.mockResolvedValueOnce(
      makePlantilla(500, 25),
    );

    const startedAt = performance.now();
    render(<EvaluationForm plantillaId={1} projectId={10} userId={5} />);
    await screen.findByText("Pregunta 500");
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(6000);
    expect(screen.getByText("0 / 500")).toBeInTheDocument();
  });

  test("actualiza masivamente respuestas sin degradacion visible", async () => {
    mockedEvaluationsService.getEstructura.mockResolvedValueOnce(
      makePlantilla(100, 10),
    );

    render(<EvaluationForm plantillaId={1} projectId={10} userId={5} />);
    await screen.findByText("Pregunta 100");

    const startedAt = performance.now();
    answerVisibleLikertQuestions(100);

    await waitFor(() => {
      expect(screen.getByText("100 / 100")).toBeInTheDocument();
    });

    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(1500);
  });
});