export { };

const PLANTILLA_ID = 1;
const EVALUATION_ID = 42;
const PROJECT_ID = 10;
const USER_ID = 5;

const fakeUser = { id: USER_ID, nombre: "Tester", email: "tester@test.com", rol: "EVALUADOR" };

const projectsFixture = [{ id: PROJECT_ID, nombre: "Proyecto Test" }];

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


const evalUrl = (plantillaId: number, projectId: number, evaluationId?: number) => {
    const base = `/evaluacion/${plantillaId}?project_id=${projectId}`;
    return evaluationId !== undefined ? `${base}&evaluation_id=${evaluationId}` : base;
};

const visitWithAuth = (url: string) => {
    cy.visit(url, {
        failOnStatusCode: false,
        onBeforeLoad(win) {
            win.localStorage.setItem("token", "fake-token");
            win.localStorage.setItem("user", JSON.stringify(fakeUser));
        },
    });
};

const mockSidebarProjects = () => {
    cy.intercept("GET", "**/projects/**", { statusCode: 200, body: projectsFixture }).as("sidebarProjects");
};

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

        cy.get("[data-cy^='respuesta-input-']").should("have.length", 3);
        cy.get("[data-cy^='respuesta-input-']").each(($el) => {
            cy.wrap($el).should("have.value", "");
        });
    });
});

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

describe("Motor de ejecucion de evaluaciones heuristicas", () => {
    type EvaluationRequestAnswer = {
        pregunta_id: number;
        valor_numerico?: number;
        opcion_id?: number;
        comentario?: string;
    };

    beforeEach(() => {
        mockSidebarProjects();
        cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
            statusCode: 200,
            body: plantillaEstructuraFixture,
        }).as("getEstructura");
    });

    const answerFirstLikert = (value: number) => {
        cy.get("[data-cy=respuesta-input-101]").parent().within(() => {
            cy.contains("span", String(value)).click();
        });
    };

    const answerSecondLikert = (value: number) => {
        cy.get("[data-cy=respuesta-input-102]").parent().within(() => {
            cy.contains("span", String(value)).click();
        });
    };

    const answerSelection = (label: string) => {
        cy.get("[data-cy=respuesta-input-201]").parent().within(() => {
            cy.contains(label).click();
        });
    };

    const answerAllQuestions = () => {
        answerFirstLikert(4);
        answerSecondLikert(5);
        answerSelection("siempre");
    };

    it("crea una evaluacion nueva y registra respuestas en la UI", () => {
        cy.intercept("PATCH", "**/evaluaciones/progress", {
            statusCode: 200,
            body: { id: EVALUATION_ID, estado: "borrador" },
        }).as("saveProgress");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructura");

        answerFirstLikert(4);
        answerSelection("siempre");

        cy.get("[data-cy=respuesta-input-101]").should("have.value", "4");
        cy.get("[data-cy=respuesta-input-201]").should("have.value", "1");
        cy.get("[data-cy=progress-count]").should("contain", "2 / 3");
        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuenow", "67");
    });

    it("guarda un borrador incompleto exitosamente", () => {
        cy.intercept("PATCH", "**/evaluaciones/progress", (req) => {
            const respuestas = req.body.respuestas as EvaluationRequestAnswer[];

            expect(req.body.evaluation_id).to.eq(undefined);
            expect(req.body.plantilla_id).to.eq(PLANTILLA_ID);
            expect(req.body.proyecto_id).to.eq(PROJECT_ID);
            expect(req.body.evaluador_id).to.eq(USER_ID);
            expect(respuestas).to.have.length(3);
            expect(respuestas.find((respuesta) => respuesta.pregunta_id === 101)?.valor_numerico).to.eq(3);

            req.reply({
                statusCode: 200,
                body: { id: EVALUATION_ID, estado: "borrador" },
            });
        }).as("saveProgress");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructura");

        answerFirstLikert(3);
        cy.contains("button", "Guardar progreso").click();

        cy.wait("@saveProgress").its("response.statusCode").should("eq", 200);
        cy.contains("Progreso guardado").should("be.visible");
        cy.get("[data-cy=progress-count]").should("contain", "1 / 3");
    });

    it("recupera un borrador guardado y permite continuar la evaluacion", () => {
        cy.intercept("GET", `**/evaluaciones/progress/${EVALUATION_ID}`, {
            statusCode: 200,
            body: progressFixture,
        }).as("getProgress");

        cy.intercept("PATCH", "**/evaluaciones/progress", {
            statusCode: 200,
            body: { id: EVALUATION_ID, estado: "borrador" },
        }).as("saveProgress");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID, EVALUATION_ID));
        cy.wait("@getEstructura");
        cy.wait("@getProgress");

        cy.get("[data-cy=respuesta-input-101]").should("have.value", "3");
        cy.get("[data-cy=respuesta-input-201]").should("have.value", "1");

        answerSecondLikert(5);

        cy.get("[data-cy=respuesta-input-102]").should("have.value", "5");
        cy.get("[data-cy=progress-count]").should("contain", "3 / 3");
        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuenow", "100");
    });

    it("envia una evaluacion completa exitosamente", () => {
        cy.intercept("PATCH", "**/evaluaciones/progress", {
            statusCode: 200,
            body: { id: EVALUATION_ID, estado: "borrador" },
        }).as("saveProgress");

        cy.intercept("POST", "**/evaluaciones/", (req) => {
            const respuestas = req.body.respuestas as EvaluationRequestAnswer[];

            expect(req.body.plantilla_id).to.eq(PLANTILLA_ID);
            expect(req.body.proyecto_id).to.eq(PROJECT_ID);
            expect(req.body.evaluador_id).to.eq(USER_ID);
            expect(respuestas).to.have.length(3);
            expect(respuestas.every((respuesta) => (
                respuesta.valor_numerico !== undefined ||
                respuesta.opcion_id !== undefined ||
                Boolean(respuesta.comentario)
            ))).to.eq(true);

            req.reply({
                statusCode: 200,
                body: { id: 123, estado: "completada", progress_percentage: 100 },
            });
        }).as("submitEvaluacion");

        cy.on("window:alert", (message) => {
            expect(message).to.contain("enviada");
        });

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructura");

        answerAllQuestions();
        cy.get("[data-cy=progress-count]").should("contain", "3 / 3");
        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuenow", "100");

        cy.contains("button", "Finalizar Evaluaci").click();

        cy.wait("@submitEvaluacion").its("response.statusCode").should("eq", 200);
        cy.location("pathname").should("eq", `/project/${PROJECT_ID}/evaluations`);
    });

    it("muestra error del backend al enviar la evaluacion", () => {
        cy.intercept("PATCH", "**/evaluaciones/progress", {
            statusCode: 200,
            body: { id: EVALUATION_ID, estado: "borrador" },
        }).as("saveProgress");

        cy.intercept("POST", "**/evaluaciones/", {
            statusCode: 400,
            body: { detail: "No se pudo registrar la evaluacion" },
        }).as("submitEvaluacionError");

        visitWithAuth(evalUrl(PLANTILLA_ID, PROJECT_ID));
        cy.wait("@getEstructura");

        answerAllQuestions();
        cy.contains("button", "Finalizar Evaluaci").click();

        cy.wait("@submitEvaluacionError").its("response.statusCode").should("eq", 400);
        cy.get("[data-cy=error-message]").should("be.visible");
        cy.location("pathname").should("eq", `/evaluacion/${PLANTILLA_ID}`);
    });
});
