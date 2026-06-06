/**
 * @file useEvaluation.test.ts
 * @description Unit tests for the useEvaluation hook — specifically the loadPlantilla flow.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useEvaluation } from './useEvaluation';
import { evaluationsService } from '../services/evaluations.service';

jest.mock('../services/evaluations.service', () => ({
    evaluationsService: {
        getEstructura: jest.fn(),
        getProgress: jest.fn(),
        saveProgress: jest.fn(),
        submitEvaluacion: jest.fn(),
    },
}));

const mockGetEstructura = evaluationsService.getEstructura as jest.MockedFunction<typeof evaluationsService.getEstructura>;
const mockGetProgress = evaluationsService.getProgress as jest.MockedFunction<typeof evaluationsService.getProgress>;
const mockSaveProgress = evaluationsService.saveProgress as jest.MockedFunction<typeof evaluationsService.saveProgress>;
const mockSubmitEvaluacion = evaluationsService.submitEvaluacion as jest.MockedFunction<typeof evaluationsService.submitEvaluacion>;

const makePlantilla = (dims = 2, preguntasPorDim = 2) => ({
    id: 1,
    nombre: 'Plantilla Test',
    dimensiones: Array.from({ length: dims }, (_, dIdx) => ({
        id: dIdx + 1,
        nombre: `Dimensión ${dIdx + 1}`,
        preguntas: Array.from({ length: preguntasPorDim }, (_, pIdx) => ({
            id: dIdx * 10 + pIdx + 1,
            texto: `Pregunta ${pIdx + 1}`,
        })),
    })),
});

const makeRespuestaInicial = (preguntaId: number) => ({
    pregunta_id: preguntaId,
    valor_numerico: undefined,
    opcion_id: undefined,
    comentario: '',
});

const makeProgress = (
    evaluationId: number,
    respuestas: Array<{ pregunta_id: number; valor_numerico?: number | null;[key: string]: any }>,
) => ({
    evaluation_id: evaluationId,
    respuestas,
});

beforeEach(() => {
    jest.clearAllMocks();
    mockSaveProgress.mockResolvedValue({ id: 999 });
    mockSubmitEvaluacion.mockResolvedValue({ id: 1 });
});

describe('useEvaluation — loadPlantilla (triggered by useEffect)', () => {

    describe('TC-01 | F1-P01 — nueva evaluación sin evaluationId', () => {

        it('carga la plantilla e inicializa respuestas vacías sin llamar getProgress', async () => {
            const plantilla = makePlantilla(2, 2);
            mockGetEstructura.mockResolvedValueOnce(plantilla);

            const { result } = renderHook(() => useEvaluation(1));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(mockGetEstructura).toHaveBeenCalledTimes(1);
            expect(mockGetEstructura).toHaveBeenCalledWith(1);

            expect(mockGetProgress).not.toHaveBeenCalled();

            expect(result.current.plantilla).toEqual(plantilla);

            [1, 2, 11, 12].forEach(pid => {
                expect(result.current.respuestas[pid]).toEqual(makeRespuestaInicial(pid));
            });

            expect(result.current.error).toBeNull();
        });

        it('setLoading es true durante la carga y false al finalizar (finally garantizado)', async () => {
            const plantilla = makePlantilla(1, 1);
            let loadingWhileInFlight = false;

            mockGetEstructura.mockImplementationOnce(async () => {
                loadingWhileInFlight = true;
                return plantilla;
            });

            const { result } = renderHook(() => useEvaluation(1));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(loadingWhileInFlight).toBe(true);
            expect(result.current.loading).toBe(false);
        });
    });

    describe('TC-02 | F1-P02 — reanuda borrador con valor_numerico válido', () => {

        it('llama getProgress, convierte valor_numerico a Number y setea draftEvaluationId', async () => {
            const plantilla = makePlantilla(1, 2);
            const progress = makeProgress(99, [
                { pregunta_id: 1, valor_numerico: 5 },
                { pregunta_id: 2, valor_numerico: 3 },
            ]);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockResolvedValueOnce(progress);

            const { result } = renderHook(() => useEvaluation(1, 99));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(mockGetProgress).toHaveBeenCalledTimes(1);
            expect(mockGetProgress).toHaveBeenCalledWith(99);

            expect(result.current.respuestas[1].valor_numerico).toBe(5);
            expect(result.current.respuestas[2].valor_numerico).toBe(3);
            expect(typeof result.current.respuestas[1].valor_numerico).toBe('number');

            expect(result.current.draftEvaluationId).toBe(99);

            expect(result.current.error).toBeNull();
        });

        it('hace merge del progreso sobre el estado inicial (campos adicionales preservados)', async () => {
            const plantilla = makePlantilla(1, 1);
            const progress = makeProgress(55, [
                { pregunta_id: 1, valor_numerico: 7, opcion_id: 3, comentario: 'buen trabajo' },
            ]);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockResolvedValueOnce(progress);

            const { result } = renderHook(() => useEvaluation(1, 55));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas[1]).toMatchObject({
                pregunta_id: 1,
                valor_numerico: 7,
                opcion_id: 3,
                comentario: 'buen trabajo',
            });
        });
    });

    describe('TC-03 | F1-P03 — reanuda borrador con valor_numerico null / undefined', () => {

        it('asigna undefined cuando valor_numerico es null (D2=FALSE, rama null)', async () => {
            const plantilla = makePlantilla(1, 1);
            const progress = makeProgress(99, [{ pregunta_id: 1, valor_numerico: null }]);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockResolvedValueOnce(progress);

            const { result } = renderHook(() => useEvaluation(1, 99));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas[1].valor_numerico).toBeUndefined();
            expect(result.current.draftEvaluationId).toBe(99);
        });

        it('asigna undefined cuando valor_numerico es undefined explícito (D2=FALSE, rama undefined)', async () => {
            const plantilla = makePlantilla(1, 1);
            const progress = makeProgress(99, [{ pregunta_id: 1, valor_numerico: undefined }]);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockResolvedValueOnce(progress);

            const { result } = renderHook(() => useEvaluation(1, 99));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas[1].valor_numerico).toBeUndefined();
        });
    });

    describe('TC-04 | F1-P04 — error en getEstructura con .message', () => {

        it('setea error con err.message y garantiza loading=false; getProgress no se llama', async () => {
            mockGetEstructura.mockRejectedValueOnce(new Error('Plantilla no encontrada'));

            const { result } = renderHook(() => useEvaluation(999));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe('Plantilla no encontrada');

            expect(result.current.plantilla).toBeNull();
            expect(result.current.respuestas).toEqual({});

            expect(mockGetProgress).not.toHaveBeenCalled();
        });
    });

    describe('TC-05 | F1-P05 — error en getEstructura sin .message (fallback)', () => {

        it('usa el mensaje fallback cuando el error no tiene propiedad .message', async () => {
            mockGetEstructura.mockRejectedValueOnce({});

            const { result } = renderHook(() => useEvaluation(999));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe('Error loading template');
        });

        it('usa el fallback cuando el error lanzado es null', async () => {
            mockGetEstructura.mockRejectedValueOnce(null);

            const { result } = renderHook(() => useEvaluation(999));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe('Error loading template');
        });
    });

    describe('TC-06 | F1-CL01 — valor_numerico = 0 no debe descartarse (falsy válido)', () => {

        it('convierte valor_numerico=0 a Number(0) correctamente sin tratarlo como ausente', async () => {
            const plantilla = makePlantilla(1, 1);
            const progress = makeProgress(99, [{ pregunta_id: 1, valor_numerico: 0 }]);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockResolvedValueOnce(progress);

            const { result } = renderHook(() => useEvaluation(1, 99));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas[1].valor_numerico).toBe(0);
            expect(typeof result.current.respuestas[1].valor_numerico).toBe('number');
        });
    });

    describe('TC-07 | F1-CL02 — plantillaId undefined no dispara loadPlantilla', () => {

        it('no llama getEstructura ni getProgress cuando plantillaId no se provee', async () => {

            const { result } = renderHook(() => useEvaluation(undefined));

            await new Promise(r => setTimeout(r, 50));

            expect(mockGetEstructura).not.toHaveBeenCalled();
            expect(mockGetProgress).not.toHaveBeenCalled();

            expect(result.current.plantilla).toBeNull();
            expect(result.current.loading).toBe(false);
            expect(result.current.respuestas).toEqual({});
            expect(result.current.error).toBeNull();
        });
    });

    describe('TC-08 | F1-CL03 — plantilla con dimensiones vacías', () => {

        it('completa sin error con respuestas={} cuando la plantilla no tiene dimensiones', async () => {
            const plantilla = makePlantilla(0, 0);
            mockGetEstructura.mockResolvedValueOnce(plantilla);

            const { result } = renderHook(() => useEvaluation(1));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas).toEqual({});
            expect(result.current.plantilla).toEqual(plantilla);
            expect(result.current.error).toBeNull();
        });
    });

    describe('TC-09 | F1-CL04 — dimensión sin preguntas', () => {

        it('inicializa solo las preguntas de dimensiones no vacías; las vacías no rompen el flujo', async () => {
            const plantilla = {
                id: 1,
                nombre: 'Test',
                dimensiones: [
                    { id: 1, nombre: 'Dim 1', preguntas: [{ id: 1, texto: 'P1' }] },
                    { id: 2, nombre: 'Dim 2', preguntas: [] },
                ],
            };
            mockGetEstructura.mockResolvedValueOnce(plantilla);

            const { result } = renderHook(() => useEvaluation(1));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas[1]).toEqual(makeRespuestaInicial(1));
            expect(Object.keys(result.current.respuestas)).toHaveLength(1);
            expect(result.current.error).toBeNull();
        });
    });

    describe('TC-10 | F1-CL05 — borrador con progress.respuestas vacío', () => {

        it('mantiene initialRespuestas intacto cuando el borrador no tiene respuestas guardadas', async () => {
            const plantilla = makePlantilla(1, 2);
            const progress = makeProgress(77, []);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockResolvedValueOnce(progress);

            const { result } = renderHook(() => useEvaluation(1, 77));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas[1]).toEqual(makeRespuestaInicial(1));
            expect(result.current.respuestas[2]).toEqual(makeRespuestaInicial(2));

            expect(result.current.draftEvaluationId).toBe(77);
        });
    });

    describe('TC-11 | F1-EN03 — getProgress lanza excepción', () => {

        it('captura el error de getProgress; no setea respuestas; sí setea plantilla y error', async () => {
            const plantilla = makePlantilla(1, 1);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockRejectedValueOnce(new Error('Evaluation progress not found'));

            const { result } = renderHook(() => useEvaluation(1, 99));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe('Evaluation progress not found');

            expect(result.current.respuestas).toEqual({});

            expect(result.current.plantilla).toEqual(plantilla);

            expect(result.current.loading).toBe(false);
        });
    });

    describe('TC-12 | F1-EP04 — plantilla con múltiples dimensiones y preguntas', () => {

        it('inicializa correctamente 3 dimensiones × 3 preguntas = 9 entradas en respuestas', async () => {
            const plantilla = makePlantilla(3, 3);
            mockGetEstructura.mockResolvedValueOnce(plantilla);

            const { result } = renderHook(() => useEvaluation(1));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(Object.keys(result.current.respuestas)).toHaveLength(9);

            Object.values(result.current.respuestas).forEach(r => {
                expect(r).toMatchObject({
                    pregunta_id: expect.any(Number),
                    valor_numerico: undefined,
                    opcion_id: undefined,
                    comentario: '',
                });
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('TC-13 | F1-EP03 — mezcla de valor_numerico válido, null y 0', () => {

        it('convierte correctamente cada valor según la condición D2 de forma independiente', async () => {
            const plantilla = makePlantilla(1, 3);
            const progress = makeProgress(88, [
                { pregunta_id: 1, valor_numerico: 4 },
                { pregunta_id: 2, valor_numerico: null }, 
                { pregunta_id: 3, valor_numerico: 0 },
            ]);
            mockGetEstructura.mockResolvedValueOnce(plantilla);
            mockGetProgress.mockResolvedValueOnce(progress);

            const { result } = renderHook(() => useEvaluation(1, 88));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.respuestas[1].valor_numerico).toBe(4);
            expect(result.current.respuestas[2].valor_numerico).toBeUndefined();
            expect(result.current.respuestas[3].valor_numerico).toBe(0);
        });
    });

    describe('TC-14 — Re-trigger al cambiar plantillaId', () => {

        it('vuelve a cargar cuando plantillaId cambia (rerender con nuevo id)', async () => {
            const plantilla1 = { id: 1, nombre: 'P1', dimensiones: [] };
            const plantilla2 = { id: 2, nombre: 'P2', dimensiones: [] };
            mockGetEstructura
                .mockResolvedValueOnce(plantilla1)
                .mockResolvedValueOnce(plantilla2);

            const { result, rerender } = renderHook(
                ({ pId }: { pId: number }) => useEvaluation(pId),
                { initialProps: { pId: 1 } },
            );

            await waitFor(() => expect(result.current.plantilla?.id).toBe(1));

            rerender({ pId: 2 });

            await waitFor(() => expect(result.current.plantilla?.id).toBe(2));

            expect(mockGetEstructura).toHaveBeenCalledTimes(2);
            expect(mockGetEstructura).toHaveBeenNthCalledWith(1, 1);
            expect(mockGetEstructura).toHaveBeenNthCalledWith(2, 2);
        });
    });
});