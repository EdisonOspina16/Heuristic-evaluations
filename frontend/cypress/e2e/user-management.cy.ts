import {
  API_URL,
  permissionsPayload,
  usersPayload,
  visitAsAdmin,
} from "../support/user-management";

describe("User management e2e and UI flows", () => {
  beforeEach(() => {
    cy.intercept("GET", `${API_URL}/users/`, usersPayload).as("getUsers");
  });

  it("creates a user from the admin modal and refreshes the directory", () => {
    // Arrange
    cy.intercept("POST", `${API_URL}/users/?role_name=ADMIN`, {
      id: 3,
      nombre: "New Admin",
      email: "new@example.com",
      active: true,
      roles: [{ id: 1, name: "ADMIN" }],
      direct_permissions: [],
      created_at: "2026-06-08T10:00:00",
    }).as("createUser");
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");

    // Act
    cy.contains("button", "Nuevo Usuario").click();
    cy.get('input[placeholder="Fullname"]').type("New Admin");
    cy.get('input[placeholder="user@ejemplo.com"]').type("new@example.com");
    cy.get('input[type="password"]').type("Secret123!");
    cy.get("select").select("ADMIN");
    cy.contains("button", "Crear Usuario").click();

    // Assert
    cy.wait("@createUser").its("request.body").should("deep.equal", {
      nombre: "New Admin",
      email: "new@example.com",
      password: "Secret123!",
    });
    cy.contains("Crear Nuevo Usuario").should("not.exist");
  });

  it("updates user status and protects backend error details", () => {
    // Arrange
    cy.intercept("PATCH", `${API_URL}/users/1/status?active=false`, {
      statusCode: 400,
      body: { detail: "Cannot deactivate the last active administrator" },
    }).as("blockedStatus");
    const alertMessages: string[] = [];
    visitAsAdmin("/account/users");
    cy.on("window:alert", (message) => alertMessages.push(message));
    cy.wait("@getUsers");

    // Act
    cy.get('[title="Desactivar"]').first().click();

    // Assert
    cy.wait("@blockedStatus");
    cy.wrap(alertMessages).should(
      "include",
      "Cannot deactivate the last active administrator",
    );
  });

  it("deletes only after confirmation", () => {
    // Arrange
    cy.intercept("DELETE", `${API_URL}/users/2`, {
      message: "User deleted successfully",
    }).as("deleteUser");
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");

    // Act + Assert
    cy.on("window:confirm", () => false);
    cy.get('[title="Eliminar"]').eq(1).click();
    cy.get("@deleteUser.all").should("have.length", 0);
  });

  it("loads permissions page and saves direct permissions for a selected user", () => {
    // Arrange
    cy.intercept(
      "GET",
      `${API_URL}/users/permissions/list`,
      permissionsPayload,
    ).as("getPermissions");
    cy.intercept("PUT", `${API_URL}/users/2/permissions`, {
      message: "Permissions updated successfully",
    }).as("savePermissions");
    visitAsAdmin("/account/permissions");
    cy.wait("@getUsers");
    cy.wait("@getPermissions");

    // Act
    cy.contains("Eva Evaluator").click();
    cy.contains("Gestionar usuarios").click();
    cy.contains("button", "Guardar Cambios").click();

    // Assert
    cy.wait("@savePermissions")
      .its("request.body")
      .should("deep.equal", ["MANAGE_USERS"]);
  });
});
