import {
  API_URL,
  permissionsPayload,
  usersPayload,
  visitAsAdmin,
} from "../support/user-management";

describe("User management accessibility", () => {
  beforeEach(() => {
    cy.intercept("GET", `${API_URL}/users/`, usersPayload).as("getUsers");
    cy.intercept(
      "GET",
      `${API_URL}/users/permissions/list`,
      permissionsPayload,
    ).as("getPermissions");
  });

  it("users directory exposes accessible headings", () => {
    // Arrange + Act
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");

    // Assert
    cy.contains("h1", "Gestión de Usuarios").should("be.visible");
    cy.get('input[placeholder="Buscar por nombre o email..."]').should(
      "be.visible",
    );
  });

  it("create user modal exposes required controls and closes from cancel", () => {
    // Arrange
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");

    // Act
    cy.contains("button", "Nuevo Usuario").click();

    // Assert
    cy.contains("h2", "Crear Nuevo Usuario").should("be.visible");

    cy.contains("button", "Cancelar").click();
    cy.contains("Crear Nuevo Usuario").should("not.exist");
  });

  it("global permissions page exposes user selection and save workflow controls", () => {
    // Arrange + Act
    visitAsAdmin("/account/permissions");
    cy.wait("@getUsers");
    cy.wait("@getPermissions");

    // Assert
    cy.contains("h1", "Permisos Globales").should("be.visible");
    cy.contains("Seleccionar Usuario").should("be.visible");
    cy.get('input[placeholder="Buscar..."]').should("be.visible");
    cy.contains("button", "Ada Admin").click();

    cy.contains("Permisos para").should("be.visible");
    cy.contains("Gestionar usuarios").should("be.visible");
    cy.contains("Eliminar usuarios").should("be.visible");
    cy.contains("button", "Guardar Cambios").should("be.visible");
    cy.contains('Nota: Los permisos marcados como "Desde Rol"').should(
      "be.visible",
    );
  });
});
