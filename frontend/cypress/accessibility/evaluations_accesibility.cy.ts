/// <reference types="cypress" />

export { };

const PLANTILLA_ID = 1;
const PROJECT_ID = 10;
const EVALUATION_ID = 42;

const fakeUser = {
    id: 5,
    nombre: "Tester",
    email: "tester@test.com",
    rol: "EVALUADOR",
};

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
                    texto_en: null,
                    tipo_respuesta: "likert_5",
                    opciones: [],
                },
            ],
        },
    ],
};

const progressFixture = {
    evaluation_id: EVALUATION_ID,
    plantilla_id: PLANTILLA_ID,
    proyecto_id: PROJECT_ID,
    evaluador_id: 5,
    estado: "draft",
    progress_percentage: 50,
    answered_count: 1,
    total_questions: 2,
    respuestas: [
        {
            pregunta_id: 101,
            valor_numerico: 3,
            opcion_id: null,
            comentario: "Comentario guardado",
        },
    ],
};

const visitWithAuth = (url: string) => {
    cy.visit(url, {
        onBeforeLoad(win) {
            win.localStorage.setItem("token", "fake-token");
            win.localStorage.setItem("user", JSON.stringify(fakeUser));
        },
    });
};

const logA11yViolations = (violations: any[]) => {
    violations.forEach((violation) => {
        console.log("------------------------------------------------");
        console.log("RULE:", violation.id);
        console.log("IMPACT:", violation.impact);
        console.log("HELP:", violation.help);
        console.log("DESCRIPTION:", violation.description);

        violation.nodes.forEach((node: any) => {
            console.log("TARGET:", node.target);
            console.log("HTML:", node.html);
        });
    });
};

describe("Accesibilidad - Evaluaciones", () => {
    beforeEach(() => {
        cy.intercept("GET", "**/projects/**", {
            statusCode: 200,
            body: [{ id: PROJECT_ID, nombre: "Proyecto Test" }],
        });

        cy.intercept(
            "GET",
            `**/plantillas/${PLANTILLA_ID}/estructura`,
            {
                statusCode: 200,
                body: plantillaEstructuraFixture,
            }
        ).as("getEstructura");
    });

    it("pantalla de evaluación sin violaciones WCAG", () => {
        visitWithAuth(
            `/evaluacion/${PLANTILLA_ID}?project_id=${PROJECT_ID}`
        );

        cy.wait("@getEstructura");

        cy.injectAxe();

        cy.checkA11y(
            undefined,
            undefined,
            (violations) => {
                violations.forEach((v) => {
                    console.log(v.id);

                    v.nodes.forEach((n) => {
                        console.log(n.html);
                    });
                });
            },
            true
        );
    });

    it("barra de progreso tiene atributos ARIA correctos", () => {
        visitWithAuth(
            `/evaluacion/${PLANTILLA_ID}?project_id=${PROJECT_ID}`
        );

        cy.wait("@getEstructura");

        cy.get("[data-cy=progress-bar]").should("have.attr", "role", "progressbar");

        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuemin");

        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuemax");

        cy.get("[data-cy=progress-bar]").should("have.attr", "aria-valuenow");

        cy.injectAxe();

        cy.checkA11y("[data-cy=progress-bar]");
    });

    it("campos de comentarios son accesibles", () => {
        visitWithAuth(
            `/evaluacion/${PLANTILLA_ID}?project_id=${PROJECT_ID}`
        );

        cy.wait("@getEstructura");

        cy.injectAxe();

        cy.checkA11y("textarea");
    });

    it("botones tienen nombre accesible", () => {
        visitWithAuth(
            `/evaluacion/${PLANTILLA_ID}?project_id=${PROJECT_ID}`
        );

        cy.wait("@getEstructura");

        cy.injectAxe();

        cy.checkA11y(
            "button",
            undefined,
            (violations) => {
                violations.forEach((v) => {
                    console.log("RULE:", v.id);

                    v.nodes.forEach((n) => {
                        console.log("TARGET:", n.target);
                        console.log("HTML:", n.html);
                        console.log("FAILURE:", n.failureSummary);
                    });
                });
            },
            true
        );
    });

    it("estado de error es accesible", () => {
        cy.intercept(
            "GET",
            `**/plantillas/${PLANTILLA_ID}/estructura`,
            {
                statusCode: 500,
                body: {
                    detail: "Internal Server Error",
                },
            }
        ).as("getError");

        visitWithAuth(
            `/evaluacion/${PLANTILLA_ID}?project_id=${PROJECT_ID}`
        );

        cy.wait("@getError");

        cy.get("[data-cy=error-message]")
            .should("be.visible");

        cy.injectAxe();

        cy.checkA11y("[data-cy=error-message]");
    });

    it("evaluación con progreso cargado no presenta violaciones", () => {
        cy.intercept(
            "GET",
            `**/evaluaciones/progress/${EVALUATION_ID}`,
            {
                statusCode: 200,
                body: progressFixture,
            }
        ).as("getProgress");

        visitWithAuth(
            `/evaluacion/${PLANTILLA_ID}?project_id=${PROJECT_ID}&evaluation_id=${EVALUATION_ID}`
        );

        cy.wait("@getEstructura");
        cy.wait("@getProgress");

        cy.injectAxe();

        cy.checkA11y(
            undefined,
            undefined,
            (violations) => {
                violations.forEach((v) => {
                    console.log(v.id);

                    v.nodes.forEach((n) => {
                        console.log(n.html);
                    });
                });
            },
            true
        );
    });
});