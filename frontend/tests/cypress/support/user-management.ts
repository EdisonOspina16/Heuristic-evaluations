export const API_URL = Cypress.env("apiUrl") as string;

export const adminSession = {
  token: "cypress-admin-token",
  user: {
    id: 1,
    nombre: "Ada Admin",
    email: "ada@example.com",
    rol: "ADMIN",
    permissions: ["MANAGE_USERS", "CREATE_USERS", "DELETE_USERS", "ASSIGN_ROLES", "ASSIGN_GLOBAL_PERMISSIONS"],
  },
};

export const usersPayload = [
  {
    id: 1,
    nombre: "Ada Admin",
    email: "ada@example.com",
    active: true,
    created_at: "2026-06-01T10:00:00",
    roles: [{ id: 1, name: "ADMIN", description: "Admin", permissions: [] }],
    direct_permissions: [],
  },
  {
    id: 2,
    nombre: "Eva Evaluator",
    email: "eva@example.com",
    active: false,
    created_at: "2026-06-02T10:00:00",
    roles: [{ id: 2, name: "EVALUADOR", description: "Evaluator", permissions: [] }],
    direct_permissions: [],
  },
];

export const permissionsPayload = [
  { id: 1, code: "MANAGE_USERS", name: "Gestionar usuarios", description: "Ver usuarios" },
  { id: 2, code: "DELETE_USERS", name: "Eliminar usuarios", description: "Eliminar usuarios" },
  { id: 3, code: "ASSIGN_ROLES", name: "Asignar roles", description: "Cambiar roles" },
];

export function visitAsAdmin(path: string) {
  cy.intercept("GET", `${API_URL}/projects/`, []).as("projects");
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("token", adminSession.token);
      win.localStorage.setItem("access_token", adminSession.token);
      win.localStorage.setItem("user", JSON.stringify(adminSession.user));
    },
  });
}
