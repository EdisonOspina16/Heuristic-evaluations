/// <reference types="cypress" />

export { };

const PLANTILLA_ID = 1;
const PROJECT_ID = 10;
const EVALUATION_ID = 42;
const USER_ID = 5;

const fakeUser = {
    id: USER_ID,
    nombre: "Tester",
    email: "tester@test.com",
    rol: "EVALUADOR",
};

const projectsFixture = [{ id: PROJECT_ID, nombre: "Proyecto Test" }];

const plantillaEstructuraFixture = {
    id: PLANTILLA_ID,
    nombre: "Evaluacion Heuristica Nielsen",
    descripcion: "Plantilla basada en principios de usabilidad",
    dimensiones: [
        {
            id: 1,
            nombre: "Visibilidad del estado",
            preguntas: [
                {
                    id: 101,
                    texto: "El sistema informa al usuario del estado actual",
                    texto_en: "Does the system keep users informed?",
                    tipo_respuesta: "likert_5",
                    opciones: [],
                },
                {
                    id: 102,
                    texto: "La retroalimentacion es oportuna",
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
                    texto: "El usuario puede deshacer acciones",
                    texto_en: null,
                    tipo_respuesta: "seleccion",
                    opciones: [
                        { id: 1, etiqueta: "Si, siempre", valor: 3, es_na: false },
                        { id: 2, etiqueta: "A veces", valor: 2, es_na: false },
                        { id: 3, etiqueta: "Nunca", valor: 1, es_na: false },
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
        { pregunta_id: 101, valor_numerico: 3, opcion_id: null, comentario: "Comentario guardado" },
        { pregunta_id: 201, valor_numerico: null, opcion_id: 1, comentario: "" },
    ],
    updated_at: "2026-06-09T10:00:00Z",
};

const evalUrl = (evaluationId?: number) => {
    const base = `/evaluacion/${PLANTILLA_ID}?project_id=${PROJECT_ID}`;
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

const mockEvaluationShell = () => {
    cy.intercept("GET", "**/projects/**", {
        statusCode: 200,
        body: projectsFixture,
    }).as("sidebarProjects");

    cy.intercept("GET", `**/plantillas/${PLANTILLA_ID}/estructura`, {
        statusCode: 200,
        body: plantillaEstructuraFixture,
    }).as("getEstructura");
};

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
    answerSelection("Si, siempre");
};

describe("Accesibilidad - Motor de ejecucion de evaluaciones heuristicas", () => {
    beforeEach(() => {
        mockEvaluationShell();
    });

    it("mantiene foco, roles y contraste al responder preguntas", () => {
        cy.intercept("PATCH", "**/evaluaciones/progress", {
            statusCode: 200,
            body: { id: EVALUATION_ID, estado: "borrador" },
        }).as("saveProgress");

        visitWithAuth(evalUrl());
        cy.wait("@getEstructura");

        answerFirstLikert(4);
        answerSecondLikert(5);
        answerSelection("Si, siempre");
        cy.get("textarea").first().focus().type("Observacion accesible").should("be.focused");

        cy.get("[data-cy=progress-bar]").should("have.attr", "role", "progressbar");
        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuenow", "100");

        cy.injectAxe();
        cy.checkA11y("form", {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa"],
            },
        });
    });

    it("recupera una evaluacion existente y conserva mensajes y formularios accesibles", () => {
        cy.intercept("GET", `**/evaluaciones/progress/${EVALUATION_ID}`, {
            statusCode: 200,
            body: progressFixture,
        }).as("getProgress");

        visitWithAuth(evalUrl(EVALUATION_ID));
        cy.wait("@getEstructura");
        cy.wait("@getProgress");

        cy.get("[data-cy=respuesta-input-101]").should("have.value", "3");
        cy.get("[data-cy=respuesta-input-201]").should("have.value", "1");
        cy.get("textarea").first().should("have.value", "Comentario guardado");
        cy.get("[data-cy=progress-count]").should("contain", "2 / 3");

        cy.injectAxe();
        cy.checkA11y("form", {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa"],
            },
        });
    });

    it("permite enviar la evaluacion completa con foco controlado y sin violaciones", () => {
        cy.intercept("PATCH", "**/evaluaciones/progress", {
            statusCode: 200,
            body: { id: EVALUATION_ID, estado: "borrador" },
        }).as("saveProgress");

        cy.intercept("POST", "**/evaluaciones/", {
            statusCode: 200,
            body: { id: 123, estado: "completada", progress_percentage: 100 },
        }).as("submitEvaluacion");

        cy.on("window:alert", (message) => {
            expect(message).to.contain("enviada");
        });

        visitWithAuth(evalUrl());
        cy.wait("@getEstructura");

        answerAllQuestions();

        cy.injectAxe();
        cy.checkA11y("form", {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa"],
            },
        });

        cy.contains("button", "Finalizar Evaluaci").focus().should("be.focused").click();
        cy.wait("@submitEvaluacion").its("response.statusCode").should("eq", 200);
        cy.location("pathname").should("eq", `/project/${PROJECT_ID}/evaluations`);
    });

    it("presenta mensajes de error accesibles cuando falla el envio", () => {
        cy.intercept("PATCH", "**/evaluaciones/progress", {
            statusCode: 200,
            body: { id: EVALUATION_ID, estado: "borrador" },
        }).as("saveProgress");

        cy.intercept("POST", "**/evaluaciones/", {
            statusCode: 400,
            body: { detail: "No se pudo enviar la evaluacion" },
        }).as("submitEvaluacionError");

        visitWithAuth(evalUrl());
        cy.wait("@getEstructura");

        answerAllQuestions();
        cy.contains("button", "Finalizar Evaluaci").click();
        cy.wait("@submitEvaluacionError");

        cy.get("[data-cy=error-message]").should("be.visible").and("contain", "No se pudo enviar");

        cy.injectAxe();
        cy.checkA11y("[data-cy=error-message]", {
            runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa"],
            },
        });
    });
});
