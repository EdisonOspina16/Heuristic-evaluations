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

  it("users directory has no critical WCAG violations", () => {
    // Arrange + Act
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");
    cy.injectAxe();

    // Assert
    cy.checkA11y(undefined, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      includedImpacts: ["critical", "serious"],
    });
  });

  it("create user modal remains accessible", () => {
    // Arrange
    visitAsAdmin("/account/users");
    cy.wait("@getUsers");
    cy.contains("button", "Nuevo Usuario").click();
    cy.injectAxe();

    // Act + Assert
    cy.checkA11y(undefined, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      includedImpacts: ["critical", "serious"],
    });
  });

  it("global permissions page has no critical WCAG violations", () => {
    // Arrange + Act
    visitAsAdmin("/account/permissions");
    cy.wait("@getUsers");
    cy.wait("@getPermissions");
    cy.injectAxe();

    // Assert
    cy.checkA11y(undefined, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      includedImpacts: ["critical", "serious"],
    });
  });
});
