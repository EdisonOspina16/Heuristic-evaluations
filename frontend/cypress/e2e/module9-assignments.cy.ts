const API_URL = Cypress.env("apiUrl") as string;

const adminUser = {
  id: 1,
  nombre: "Ada Admin",
  email: "ada@example.com",
  rol: "ADMIN",
  permissions: ["MANAGE_USERS", "CREATE_PROJECTS"],
};

const evaluatorUser = {
  id: 7,
  nombre: "Juan Perez",
  email: "juan@example.com",
  rol: "EVALUADOR",
  permissions: ["CREATE_EVALUATIONS", "VIEW_REPORTS"],
};

const plantillas = [
  { id: 1, codigo: "UI", nombre: "UI", descripcion: "Interfaz", version: 1, activa: true },
  { id: 2, codigo: "UX", nombre: "UX", descripcion: "Experiencia", version: 1, activa: true },
  { id: 3, codigo: "ACC", nombre: "Accesibilidad", descripcion: "Accesibilidad", version: 1, activa: true },
];

function visitWithUser(path: string, user: typeof adminUser | typeof evaluatorUser) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("token", `${user.rol.toLowerCase()}-token`);
      win.localStorage.setItem("access_token", `${user.rol.toLowerCase()}-token`);
      win.localStorage.setItem("user", JSON.stringify(user));
    },
  });
}

describe("Modulo 9 - Asignacion de evaluadores por proyecto", () => {
  it("admin creates and updates evaluator assignment with focus and allowed types", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/users/`, [
      { id: 1, nombre: "Ada Admin", email: "ada@example.com", roles: [{ name: "ADMIN" }] },
      { id: 7, nombre: "Juan Perez", email: "juan@example.com", roles: [{ name: "EVALUADOR" }] },
    ]).as("users");
    cy.intercept("GET", `${API_URL}/plantillas/`, plantillas).as("plantillas");
    cy.intercept("GET", `${API_URL}/projects/10/assignments`, []).as("assignments");
    cy.intercept("POST", `${API_URL}/projects/10/assignments`, {
      id: 55,
      evaluator_id: 7,
      evaluator_name: "Juan Perez",
      evaluator_email: "juan@example.com",
      project_id: 10,
      role: "UX",
      allowed_evaluation_types: ["UI", "UX"],
    }).as("saveAssignment");

    // Act
    visitWithUser("/project/10/assignments", adminUser);
    cy.wait(["@users", "@plantillas", "@assignments"]);
    cy.contains("Juan Perez").should("be.visible");
    cy.get('input[placeholder="Enfoque: UI, UX, Accesibilidad..."]').clear().type("UX");
    cy.contains(".inline-flex", "UI").click();
    cy.contains(".inline-flex", "UX").click();
    cy.contains("button", "Guardar").click();

    // Assert
    cy.wait("@saveAssignment").its("request.body").should("deep.equal", {
      evaluator_id: 7,
      role: "UX",
      allowed_evaluation_types: ["UI", "UX"],
      project_id: 10,
    });
  });

  it("evaluator sees own and assigned projects and cannot continue with a forbidden template", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/plantillas/`, plantillas).as("plantillas");
    cy.intercept("GET", `${API_URL}/projects/`, [
      { id: 10, nombre: "Proyecto A", descripcion: "Asignado", cliente: "QA", creado_por: 1, created_at: "2026-06-10T10:00:00" },
      { id: 20, nombre: "Proyecto B", descripcion: "Propio", cliente: "QA", creado_por: 7, created_at: "2026-06-10T11:00:00" },
    ]).as("projects");
    cy.intercept("GET", `${API_URL}/evaluaciones/proyecto/*`, []).as("evaluaciones");
    cy.intercept("GET", `${API_URL}/projects/10/assignments`, [
      { id: 1, evaluator_id: 7, evaluator_name: "Juan Perez", evaluator_email: "juan@example.com", project_id: 10, role: "UI", allowed_evaluation_types: ["UI"] },
    ]).as("project10Assignments");
    cy.intercept("GET", `${API_URL}/projects/20/assignments`, []).as("project20Assignments");

    // Act
    visitWithUser("/dashboard", evaluatorUser);
    cy.wait(["@plantillas", "@projects", "@project10Assignments", "@project20Assignments"]);
    cy.contains("UX").parents(".group").contains("button", "Comenzar Evaluaci\u00f3n").click();
    cy.get("select").select("Proyecto A (QA)");

    // Assert
    cy.contains("Esta plantilla no est\u00e1 asignada a tu enfoque en este proyecto.").should("be.visible");
    cy.contains("button", "Continuar").should("be.disabled");
  });

  it("allows any template when the assigned evaluator has no type restrictions", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/plantillas/`, plantillas).as("plantillas");
    cy.intercept("GET", `${API_URL}/projects/`, [
      { id: 20, nombre: "Proyecto B", descripcion: "Propio", cliente: "QA", creado_por: 7, created_at: "2026-06-10T11:00:00" },
    ]).as("projects");
    cy.intercept("GET", `${API_URL}/evaluaciones/proyecto/*`, []).as("evaluaciones");
    cy.intercept("GET", `${API_URL}/projects/20/assignments`, []).as("assignments");

    // Act
    visitWithUser("/dashboard", evaluatorUser);
    cy.wait(["@plantillas", "@projects", "@assignments"]);
    cy.contains("Accesibilidad").parents(".group").contains("button", "Comenzar Evaluaci\u00f3n").click();
    cy.get("select").select("Proyecto B (QA)");
    cy.contains("button", "Continuar").click();

    // Assert
    cy.location("pathname").should("equal", "/evaluacion/3");
    cy.location("search").should("contain", "project_id=20");
  });
});

export {};
