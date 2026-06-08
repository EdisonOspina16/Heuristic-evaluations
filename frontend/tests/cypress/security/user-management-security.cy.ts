import { API_URL, adminSession, usersPayload } from "../support/user-management";

describe("User management frontend security", () => {
  it("redirects unauthenticated visitors away from users administration", () => {
    // Arrange + Act
    cy.visit("/account/users");

    // Assert
    cy.url().should("include", "/login");
  });

  it("does not show administration links to evaluator users", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/projects/`, []);
    cy.visit("/dashboard", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "evaluator-token");
        win.localStorage.setItem("user", JSON.stringify({
          id: 2,
          nombre: "Eva Evaluator",
          email: "eva@example.com",
          rol: "EVALUADOR",
          permissions: ["VIEW_REPORTS"],
        }));
      },
    });

    // Assert
    cy.contains("Administración").should("not.exist");
    cy.contains("Usuarios").should("not.exist");
  });

  it("uses bearer token when requesting protected users data", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/projects/`, []);
    cy.intercept("GET", `${API_URL}/users/`, (req) => {
      expect(req.headers.authorization).to.eq(`Bearer ${adminSession.token}`);
      req.reply(usersPayload);
    }).as("getUsersWithAuth");

    // Act
    cy.visit("/account/users", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", adminSession.token);
        win.localStorage.setItem("access_token", adminSession.token);
        win.localStorage.setItem("user", JSON.stringify(adminSession.user));
      },
    });

    // Assert
    cy.wait("@getUsersWithAuth");
  });
});
