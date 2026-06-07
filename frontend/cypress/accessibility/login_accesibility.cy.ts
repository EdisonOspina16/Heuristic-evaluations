describe("Accesibilidad", () => {

  beforeEach(() => {
    cy.injectAxe();
  });

  it("login — sin violaciones", () => {
    cy.visit("/login");
    cy.injectAxe();

    cy.checkA11y(undefined, {
   
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    });
  });

  it("mensaje de error es accesible", () => {
    cy.visit("/login");
    cy.injectAxe();

    cy.get('input[type="email"]').type("wrong@test.com");
    cy.get('input[type="password"]').type("wrong");
    cy.contains("button", "Iniciar Sesión").click();

  
    cy.get('[role="alert"]').should("be.visible");
    cy.checkA11y('[role="alert"]'); 
  });

});