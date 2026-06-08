import { API_URL, usersPayload, visitAsAdmin } from "../support/user-management";

describe("User management regression", () => {
  it("blocked last-admin status change keeps admin visible and active in UI", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/users/`, usersPayload).as("getUsers");
    cy.intercept("PATCH", `${API_URL}/users/1/status?active=false`, {
      statusCode: 400,
      body: { detail: "Cannot deactivate the last active administrator" },
    }).as("blockedStatus");
    const alerts: string[] = [];
    cy.on("window:alert", (message) => alerts.push(message));

    // Act
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");
    cy.get('[title="Desactivar"]').first().click();

    // Assert
    cy.wait("@blockedStatus");
    cy.contains("Ada Admin").should("be.visible");
    cy.contains("ACTIVO").should("be.visible");
    cy.wrap(alerts).should("include", "Cannot deactivate the last active administrator");
  });

  it("blocked last-admin delete keeps admin row visible", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/users/`, usersPayload).as("getUsers");
    cy.intercept("DELETE", `${API_URL}/users/1`, {
      statusCode: 400,
      body: { detail: "Cannot delete the last administrator" },
    }).as("blockedDelete");
    cy.on("window:confirm", () => true);

    // Act
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");
    cy.get('[title="Eliminar"]').first().click();

    // Assert
    cy.wait("@blockedDelete");
    cy.contains("Ada Admin").should("be.visible");
  });
});
