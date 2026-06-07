type TestUser = {
  nombre: string;
  email: string;
  password: string;
};

const apiUrl = Cypress.env("apiUrl") as string;

const makeUser = (prefix: string): TestUser => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return {
    nombre: `Cypress ${prefix} ${suffix}`,
    email: `cypress.${prefix.toLowerCase()}.${suffix}@example.com`,
    password: "Secret123!",
  };
};

describe("Register flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("completes the three-step register flow and redirects to the dashboard", () => {
    const user = makeUser("Register");

    cy.intercept("POST", `${apiUrl}/auth/register`).as("registerRequest");
    cy.intercept("POST", `${apiUrl}/auth/login`).as("autoLoginRequest");

    cy.visit("/register");

    cy.contains("Crea tu cuenta").should("be.visible");
    cy.get('[data-testid="register-step-1"]').should("be.visible");

    cy.get('input[placeholder="Juan Pérez"]').type(user.nombre);
    cy.contains("button", "Continuar").click();

    cy.get('[data-testid="register-step-2"]').should("be.visible");
    cy.get('input[placeholder="juan@ejemplo.com"]').type(user.email);
    cy.contains("button", "Continuar").click();

    cy.get('[data-testid="register-step-3"]').should("be.visible");
    cy.get('input[type="password"]').type(user.password);
    cy.contains("button", "Finalizar Registro").click();

    cy.wait("@registerRequest")
      .its("response.statusCode")
      .should("eq", 200);
    cy.wait("@autoLoginRequest")
      .its("response.statusCode")
      .should("eq", 200);

    cy.url().should("include", "/dashboard");
    cy.contains("Dashboard").should("be.visible");
    cy.window().then((win) => {
      cy.wrap(win.localStorage.getItem("user")).should("contain", user.email);
      cy.wrap(win.localStorage.getItem("access_token")).should("not.be.null");
      cy.wrap(win.localStorage.getItem("token")).should("not.be.null");
    });
  });

  it("shows a backend validation error when registering an existing email", () => {
    const user = makeUser("Duplicate");

    cy.request("POST", `${apiUrl}/auth/register`, {
      nombre: user.nombre,
      email: user.email,
      password: user.password,
    });

    cy.intercept("POST", `${apiUrl}/auth/register`).as("duplicateRegister");

    cy.visit("/register");

    cy.get('input[placeholder="Juan Pérez"]').type(user.nombre);
    cy.contains("button", "Continuar").click();

    cy.get('input[placeholder="juan@ejemplo.com"]').type(user.email);
    cy.contains("button", "Continuar").click();

    cy.get('input[type="password"]').type(user.password);
    cy.contains("button", "Finalizar Registro").click();

    cy.wait("@duplicateRegister")
      .its("response.statusCode")
      .should("eq", 400);
    
    cy.get('[role="alert"]').should("be.visible").and("contain.text", "Email already registered");
    cy.url().should("include", "/register");
  });
 

  it("back button on step 2 returns to step 1 preserving the name", () => {
    const user = makeUser("Back2");

    cy.visit("/register");

    
    cy.get('input[placeholder="Juan Pérez"]').type(user.nombre);
    cy.contains("button", "Continuar").click();
    cy.get('[data-testid="register-step-2"]').should("be.visible");

  
    cy.contains("button", "Volver").click();

   
    cy.get('[data-testid="register-step-1"]').should("be.visible");
    cy.get('input[placeholder="Juan Pérez"]').should("have.value", user.nombre);
  });

  it("back button on step 3 returns to step 2 preserving the email", () => {
    const user = makeUser("Back3");

    cy.visit("/register");

    
    cy.get('input[placeholder="Juan Pérez"]').type(user.nombre);
    cy.contains("button", "Continuar").click();
    cy.get('input[placeholder="juan@ejemplo.com"]').type(user.email);
    cy.contains("button", "Continuar").click();
    cy.get('[data-testid="register-step-3"]').should("be.visible");

    
    cy.contains("button", "Volver").click();

   
    cy.get('[data-testid="register-step-2"]').should("be.visible");
    cy.get('input[placeholder="juan@ejemplo.com"]').should("have.value", user.email);
  });

  it("Continuar button is disabled when nombre is empty on step 1", () => {
    cy.visit("/register");


    cy.get('[data-testid="register-step-1"]').should("be.visible");
    cy.contains("button", "Continuar").should("be.disabled");
  });

  it("Continuar button is disabled when email is empty on step 2", () => {
    const user = makeUser("EmptyEmail");

    cy.visit("/register");


    cy.get('input[placeholder="Juan Pérez"]').type(user.nombre);
    cy.contains("button", "Continuar").click();

   
    cy.get('[data-testid="register-step-2"]').should("be.visible");
    cy.contains("button", "Continuar").should("be.disabled");
  });

  it("Finalizar Registro button is disabled when password is empty on step 3", () => {
    const user = makeUser("EmptyPass");

    cy.visit("/register");

    cy.get('input[placeholder="Juan Pérez"]').type(user.nombre);
    cy.contains("button", "Continuar").click();
    cy.get('input[placeholder="juan@ejemplo.com"]').type(user.email);
    cy.contains("button", "Continuar").click();

   
    cy.get('[data-testid="register-step-3"]').should("be.visible");
    cy.contains("button", "Finalizar Registro").should("be.disabled");
  });


  it("progress bar advances through all three steps", () => {
    const user = makeUser("Progress");

    cy.visit("/register");

    
    cy.get('[data-testid="registration-progress"]')
      .should("have.attr", "style")
      .and("include", "0%");

    
    cy.get('input[placeholder="Juan Pérez"]').type(user.nombre);
    cy.contains("button", "Continuar").click();
    cy.get('[data-testid="registration-progress"]')
      .should("have.attr", "style")
      .and("include", "50%");

   
    cy.get('input[placeholder="juan@ejemplo.com"]').type(user.email);
    cy.contains("button", "Continuar").click();
    cy.get('[data-testid="registration-progress"]')
      .should("have.attr", "style")
      .and("include", "100%");
  });

  it("navigates to login page from the register footer link", () => {
    cy.visit("/register");

    cy.contains("a", "Inicia sesión aquí").click();

    cy.url().should("include", "/login");
  });
});
