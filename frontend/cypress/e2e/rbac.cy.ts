const API_URL = Cypress.env("apiUrl") as string;

const adminUser = {
  id: 1,
  nombre: "Ada Admin",
  email: "admin@example.com",
  rol: "ADMIN",
  permissions: ["MANAGE_USERS", "ASSIGN_ROLES", "ASSIGN_GLOBAL_PERMISSIONS"],
};

const evaluatorUser = {
  id: 2,
  nombre: "Eva Evaluator",
  email: "eva@example.com",
  rol: "EVALUADOR",
  permissions: ["CREATE_EVALUATIONS"],
};

const usersResponse = [
  {
    id: 1,
    nombre: "Ada Admin",
    email: "admin@example.com",
    roles: [{ name: "ADMIN", permissions: [] }],
    direct_permissions: [],
  },
  {
    id: 2,
    nombre: "Eva Evaluator",
    email: "eva@example.com",
    roles: [{ name: "EVALUADOR", permissions: [] }],
    direct_permissions: [],
  },
];

const permissionsResponse = [
  { code: "MANAGE_USERS", name: "Gestionar usuarios", description: "Permite gestionar usuarios" },
  { code: "ASSIGN_ROLES", name: "Asignar roles", description: "Permite asignar roles" },
  { code: "ASSIGN_GLOBAL_PERMISSIONS", name: "Asignar permisos globales", description: "Permite asignar permisos directos" },
];

describe("RBAC admin permissions page", () => {
  beforeEach(() => {
    cy.viewport(1280, 720) // ← fix del sidebar oculto
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it("allows ADMIN to reach the Global Permissions page and save a permission change", () => {
    cy.intercept("GET", `${API_URL}/users/`, { statusCode: 200, body: usersResponse }).as("getUsers")
    cy.intercept("GET", `${API_URL}/users/permissions/list`, { statusCode: 200, body: permissionsResponse }).as("getPermissions")
    cy.intercept("PUT", `${API_URL}/users/1/permissions`, {
      statusCode: 200,
      body: { message: "Permissions updated successfully" },
    }).as("savePermissions")

    cy.visit("/account/permissions", {
      onBeforeLoad(win) { // ← fix del localStorage antes del visit
        win.localStorage.setItem("token", "admin-token")
        win.localStorage.setItem("access_token", "admin-token")
        win.localStorage.setItem("user", JSON.stringify(adminUser))
      },
    })

    cy.wait(["@getUsers", "@getPermissions"])
    cy.contains("Permisos Globales").should("be.visible")
    cy.contains("Ada Admin").click()
    cy.contains("Seleccionar Usuario").should("be.visible")
    cy.contains("Gestionar usuarios").click()
    cy.get("button").contains(/guardar cambios/i).click()
    cy.wait("@savePermissions").its("request.body").should("deep.equal", ["ASSIGN_ROLES", "ASSIGN_GLOBAL_PERMISSIONS"])
  })

  it("redirects an evaluator away from the Global Permissions page", () => {
    cy.visit("/account/permissions", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "evaluator-token")
        win.localStorage.setItem("access_token", "evaluator-token")
        win.localStorage.setItem("user", JSON.stringify(evaluatorUser))
      },
    })
    cy.url().should("include", "/dashboard")
  })
})