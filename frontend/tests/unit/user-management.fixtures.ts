export const adminUser = {
  id: 1,
  nombre: "Ada Admin",
  email: "ada@example.com",
  rol: "ADMIN",
  permissions: ["MANAGE_USERS", "CREATE_USERS", "DELETE_USERS", "ASSIGN_ROLES"],
};

export const evaluatorUser = {
  id: 2,
  nombre: "Eva Evaluator",
  email: "eva@example.com",
  rol: "EVALUADOR",
  permissions: ["VIEW_REPORTS"],
};

export const usersApiPayload = [
  {
    id: 1,
    nombre: "Ada Admin",
    email: "ada@example.com",
    active: true,
    created_at: "2026-06-01T10:00:00",
    roles: [{ id: 1, name: "ADMIN", description: "Administrador", permissions: [] }],
    direct_permissions: [],
  },
  {
    id: 2,
    nombre: "Eva Evaluator",
    email: "eva@example.com",
    active: false,
    created_at: "2026-06-02T10:00:00",
    roles: [{ id: 2, name: "EVALUADOR", description: "Evaluador", permissions: [] }],
    direct_permissions: [],
  },
  {
    id: 3,
    nombre: "No Role User",
    email: "norole@example.com",
    active: true,
    created_at: "2026-06-03T10:00:00",
    roles: [],
    direct_permissions: [],
  },
];

export const permissionsApiPayload = [
  { id: 1, code: "MANAGE_USERS", name: "Gestionar usuarios", description: "Ver usuarios" },
  { id: 2, code: "DELETE_USERS", name: "Eliminar usuarios", description: "Eliminar usuarios" },
  { id: 3, code: "ASSIGN_ROLES", name: "Asignar roles", description: "Cambiar roles" },
];
