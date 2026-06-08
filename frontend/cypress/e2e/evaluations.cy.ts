/**
 * E2E Tests - Evaluaciones Heurísticas
 * Ruta real (Next.js): /evaluacion/[id]?project_id=X&evaluation_id=Y
 */

export { };

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PLANTILLA_ID = 1;
const EVALUATION_ID = 42;
const PROJECT_ID = 10;
const USER_ID = 5;

const fakeUser = { id: USER_ID, nombre: "Tester", email: "tester@test.com", rol: "EVALUADOR" };

const projectsFixture = [{ id: PROJECT_ID, nombre: "Proyecto Test" }];

/**
 * Fixture completo con los campos que EvaluationForm necesita:
 * - tipo_respuesta → usado en pregunta.tipo_respuesta.startsWith('likert')
 * - opciones       → usado en pregunta.opciones.map(...)
 * - descripcion    → usado en plantilla.descripcion
 */
const plantillaEstructuraFixture = {
    id: PLANTILLA_ID,
    nombre: "Evaluación Heurística Nielsen",
    descripcion: "Plantilla basada en los 10 principios de Nielsen",
    dimensiones: [
        {
            id: 1,
            nombre: "Visibilidad del estado",
            preguntas: [
                {
                    id: 101,
                    texto: "¿El sistema informa al usuario del estado actual?",
                    texto_en: "Does the system keep users informed?",
                    tipo_respuesta: "likert_5",
                    opciones: [],
                },
                {
                    id: 102,
                    texto: "¿La retroalimentación es oportuna?",
                    texto_en: null,
                    tipo_respuesta: "likert_5",
                    opciones: [],
                },
            ],
        },
        {
            id: 2,
            nombre: "Control y libertad",
            preguntas: [
                {
                    id: 201,
                    texto: "¿El usuario puede deshacer acciones?",
                    texto_en: null,
                    tipo_respuesta: "seleccion",
                    opciones: [
                        { id: 1, etiqueta: "Sí, siempre", valor: 3, es_na: false },
                        { id: 2, etiqueta: "A veces", valor: 2, es_na: false },
                        { id: 3, etiqueta: "Nunca", valor: 1, es_na: false },
                        { id: 4, etiqueta: "N/A", valor: 0, es_na: true },
                    ],
                },
            ],
        },
    ],
};

const progressFixture = {
    evaluation_id: EVALUATION_ID,
    plantilla_id: PLANTILLA_ID,
    proyecto_id: PROJECT_ID,
    evaluador_id: USER_ID,
    estado: "draft",
    progress_percentage: 66,
    answered_count: 2,
    total_questions: 3,
    respuestas: [
        { pregunta_id: 101, valor_numerico: 3, opcion_id: null, comentario: "Buena visibilidad" },
        { pregunta_id: 201, valor_numerico: null, opcion_id: 1, comentario: "" },
    ],
    updated_at: "2024-11-01T10:00:00Z",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const evalUrl = (plantillaId: number, projectId: number, evaluationId?: number) => {
    const base = `/evaluacion/${plantillaId}?project_id=${projectId}`;
    return evaluationId !== undefined ? `${base}&evaluation_id=${evaluationId}` : base;
};

/**
 * Visita inyectando auth en localStorage ANTES de que Next.js ejecute código.
 * - 'token' → interceptor Axios (api.ts)
 * - 'user'  → authService.getCurrentUser() y Sidebar
 */
const visitWithAuth = (url: string) => {
    cy.visit(url, {
        failOnStatusCode: false,
        onBeforeLoad(win) {
            win.localStorage.setItem("token", "fake-token");
            win.localStorage.setItem("user", JSON.stringify(fakeUser));
        },
    });
};

/**
 * El Sidebar en RootLayout llama a GET /projects/ en cada render.
 * Sin este mock recibe 401 y puede interrumpir la carga de la página.
 */
const mockSidebarProjects = () => {
    cy.intercept("GET", "**/projects/**", { statusCode: 200, body: projectsFixture }).as("sidebarProjects");
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /plantillas/:id/estructura  →  get_estructura
// ─────────────────────────────────────────────────────────────────────────────

describe("API: GET /plantillas/:id/estructura", () => {
    beforeEach(() => {
        mockSidebarProjects();
    });

    it("retorna la estructura completa con dimensiones y preguntas", () => {
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 200,
            body: plantillaEstructuraFixture,
        }).as("getEstructura");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructura").its("response.statusCode").should("eq", 200);

        cy.get("[data-cy=dimension-title]").should("have.length", 2);
        cy.get("[data-cy=dimension-title]").first().should("contain", "Visibilidad del estado");
    });

    it("retorna 404 cuando la plantilla no existe", () => {
        cy.intercept("GET", "**/plantillas/9999/estructura", {
            statusCode: 404,
            body: { detail: "Plantilla no encontrada" },
        }).as("getEstructuraNotFound");

        visitWithAuth(evalUrl(9999, PROJECT_ID));
        cy.wait("@getEstructuraNotFound").its("response.statusCode").should("eq", 404);

        cy.get("[data-cy=error-message]").should("be.visible");
    });

    it("inicializa las respuestas vacías para cada pregunta de la estructura", () => {
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 200,
            body: plantillaEstructuraFixture,
        }).as("getEstructura");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructura");

        // data-cy^= matches all inputs regardless of suffix (respuesta-input-101, -102, -201)
        cy.get("[data-cy^='respuesta-input-']").should("have.length", 3);
        cy.get("[data-cy^='respuesta-input-']").each(($el) => {
            cy.wrap($el).should("have.value", "");
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /evaluaciones/progress/:id  →  get_progress
// ─────────────────────────────────────────────────────────────────────────────

describe("API: GET /evaluaciones/progress/:id", () => {
    beforeEach(() => {
        mockSidebarProjects();
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 200,
            body: plantillaEstructuraFixture,
        }).as("getEstructura");
    });

    it("retorna el progreso guardado con las respuestas previas", () => {
        cy.intercept("GET", `**/evaluaciones/progress/${EVALUATION_ID}`, {
            statusCode: 200,
            body: progressFixture,
        }).as("getProgress");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, EVALUATION_ID));
        cy.wait("@getEstructura");
        cy.wait("@getProgress").its("response.body.evaluation_id").should("eq", EVALUATION_ID);

        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuenow", "67");
    });

    it("retorna 404 cuando el evaluation_id no existe", () => {
        cy.intercept("GET", "**/evaluaciones/progress/9999", {
            statusCode: 404,
            body: { detail: "Evaluation progress not found" },
        }).as("getProgressNotFound");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, 9999));
        cy.wait("@getEstructura");
        cy.wait("@getProgressNotFound").its("response.statusCode").should("eq", 404);

        cy.get("[data-cy=error-message]").should("be.visible");
    });

    it("muestra answered_count y total_questions correctamente en la UI", () => {
        cy.intercept("GET", `**/evaluaciones/progress/${EVALUATION_ID}`, {
            statusCode: 200,
            body: progressFixture,
        }).as("getProgress");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, EVALUATION_ID));
        cy.wait("@getEstructura");
        cy.wait("@getProgress");

        cy.get("[data-cy=progress-count]")
            .should("contain", `${progressFixture.answered_count} / ${progressFixture.total_questions}`);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Hook: loadPlantilla (useEvaluation)
// ─────────────────────────────────────────────────────────────────────────────

describe("Hook: loadPlantilla", () => {
    beforeEach(() => {
        mockSidebarProjects();
    });

    it("carga la plantilla y muestra sus dimensiones en pantalla", () => {
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 200,
            body: plantillaEstructuraFixture,
        }).as("getEstructura");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructura");

        cy.get("[data-cy=dimension-title]").should("have.length", 2);
    });

    it("cuando existe evaluationId, fusiona el progreso sobre las respuestas inicializadas", () => {
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 200,
            body: plantillaEstructuraFixture,
        }).as("getEstructura");

        cy.intercept("GET", `**/evaluaciones/progress/${EVALUATION_ID}`, {
            statusCode: 200,
            body: progressFixture,
        }).as("getProgress");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, EVALUATION_ID));
        cy.wait("@getEstructura");
        cy.wait("@getProgress");

        // Pregunta 101 (likert) tiene valor_numerico: 3 guardado → hidden input refleja "3"
        cy.get("[data-cy=respuesta-input-101]").should("have.value", "3");
        // Pregunta 102 sin respuesta → vacío
        cy.get("[data-cy=respuesta-input-102]").should("have.value", "");
    });

    it("muestra un estado de error si la carga de la plantilla falla", () => {
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 500,
            body: { detail: "Internal Server Error" },
        }).as("getEstructuraError");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructuraError");

        cy.get("[data-cy=error-message]").should("be.visible");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Service: get_progreso — testeado vía endpoint
// ─────────────────────────────────────────────────────────────────────────────

describe("Service: get_progreso via /evaluaciones/progress/:id", () => {
    beforeEach(() => {
        mockSidebarProjects();
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 200,
            body: plantillaEstructuraFixture,
        }).as("getEstructura");
    });

    it("devuelve estado 'draft' y el porcentaje de progreso correcto", () => {
        cy.intercept("GET", `**/evaluaciones/progress/${EVALUATION_ID}`, {
            statusCode: 200,
            body: progressFixture,
        }).as("getProgreso");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, EVALUATION_ID));
        cy.wait("@getEstructura");
        cy.wait("@getProgreso").its("response.body").then((body) => {
            expect(body.estado).to.eq("draft");
            expect(body.progress_percentage).to.eq(66);
        });
    });

    it("retorna null-safe cuando valor_numerico es null y usa opcion_id", () => {
        cy.intercept("GET", `**/evaluaciones/progress/${EVALUATION_ID}`, {
            statusCode: 200,
            body: progressFixture,
        }).as("getProgreso");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, EVALUATION_ID));
        cy.wait("@getEstructura");
        cy.wait("@getProgreso").its("response.body.respuestas").then((respuestas) => {
            const respConOpcion = respuestas.find((r: any) => r.opcion_id !== null);
            expect(respConOpcion.valor_numerico).to.be.null;
            expect(respConOpcion.opcion_id).to.eq(1);
        });
    });

    it("devuelve 404 cuando evaluation_id no existe en BD", () => {
        cy.intercept("GET", "**/evaluaciones/progress/0", {
            statusCode: 404,
            body: { detail: "Evaluation progress not found" },
        }).as("getProgresoNull");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, 0));

        cy.wait("@getEstructura");
        cy.wait("@getProgresoNull")
            .its("response.statusCode")
            .should("eq", 404);

        cy.get("[data-cy=error-message]")
            .should("be.visible");
    });
});