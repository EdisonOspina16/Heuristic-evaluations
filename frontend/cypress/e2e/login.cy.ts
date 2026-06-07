
const API_URL = Cypress.env("apiUrl") as string;

describe("Login flow", () => {
  const user = {
    nombre: "Cypress Tester",
    email: "cypress.tester@example.com",
    password: "Secret123!"
  }

  beforeEach(() => {  
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit("/login")
  });

  it("logs in successfully and lands on the dashboard", () => {
    cy.intercept("POST", `${API_URL}/auth/login`).as("loginRequest");

    cy.visit("/login");

    cy.contains("Bienvenido de nuevo").should("be.visible");
    cy.get('input[type="email"]').type(user.email);
    cy.get('input[type="password"]').type(user.password);
    cy.contains("button", "Iniciar Sesión").click();

    cy.wait("@loginRequest")
      .its("response.statusCode")
      .should("eq", 200);

    cy.url().should("include", "/dashboard");
    cy.contains("Dashboard").should("be.visible");
    cy.window().then((win) => {
      cy.wrap(win.localStorage.getItem("access_token")).should("not.be.null");
      cy.wrap(win.localStorage.getItem("user")).should("contain", user.email);
    });
  });

  it("shows an error when the backend rejects the credentials", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type(user.email);
    cy.get('input[type="password"]').type("WrongPassword123!");
    cy.contains("button", "Iniciar Sesión").click();

    cy.contains('[role="alert"]', "Incorrect email or password").should("be.visible");
    cy.url().should("include", "/login");
  });

 

it("disables the button and shows loader while submitting", () => {
  
  cy.intercept("POST", `${API_URL}/auth/login`, (req) => {
    req.continue((res) => {
      res.setDelay(1500);
    });
  }).as("slowLogin");

  cy.visit("/login");

  
  cy.get('input[type="email"]').type(user.email);
  cy.get('input[type="password"]').type(user.password);
  cy.contains("button", "Iniciar Sesión").click();

 
   cy.get('button[type="submit"]').should("be.disabled");
   
  cy.wait("@slowLogin");
});

it("clears previous error when submitting again", () => {
  // Arrange — primer intento fallido
  cy.visit("/login");
  cy.get('input[type="email"]').type(user.email);
  cy.get('input[type="password"]').type("WrongPassword123!");
  cy.contains("button", "Iniciar Sesión").click();
  cy.get('[role="alert"]').should("be.visible");

  // Act — segundo intento correcto
  cy.intercept("POST", `${API_URL}/auth/login`).as("retryLogin");
  cy.get('input[type="password"]').clear().type(user.password);
  cy.contains("button", "Iniciar Sesión").click();

  // Assert — error desaparece
  cy.get('[role="alert"]').should("not.exist");
  cy.wait("@retryLogin").its("response.statusCode").should("eq", 200);
});

it("navigates to register page from login", () => {
  // Arrange
  cy.visit("/login");

  // Act
  cy.contains("a", "Regístrate ahora").click();

  // Assert
  cy.url().should("include", "/register");
});
});
