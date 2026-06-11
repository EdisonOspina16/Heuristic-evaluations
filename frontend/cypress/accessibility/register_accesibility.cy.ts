import "cypress-axe";

describe("Accesibilidad — Register", () => {

  it("register step 1 — sin violaciones", () => {
    cy.visit("/register")
    cy.get('input[placeholder="Juan Pérez"]').should("be.visible")
    cy.injectAxe()
    cy.checkA11y(undefined, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    })
  })

  it("register step 2 — sin violaciones", () => {

    cy.visit("/register");
    cy.injectAxe();


    cy.get('input[placeholder="Juan Pérez"]').type("Juan");
    cy.contains("button", "Continuar").click();
    cy.get('[data-testid="register-step-2"]').should("be.visible");


    cy.checkA11y(undefined, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  });

  it("register step 3 — sin violaciones", () => {

    cy.visit("/register");
    cy.injectAxe();


    cy.get('input[placeholder="Juan Pérez"]').type("Juan");
    cy.contains("button", "Continuar").click();
    cy.get('[data-testid="register-step-2"]').should("be.visible");


    cy.get('input[placeholder="juan@ejemplo.com"]').type("juan@test.com");
    cy.contains("button", "Continuar").click();
    cy.get('[data-testid="register-step-3"]').should("be.visible");


    cy.checkA11y(undefined, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  });

});