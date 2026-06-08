import { API_URL, visitAsAdmin } from "../support/user-management";

function makeUsers(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    nombre: `Perf User ${index + 1}`,
    email: `perf-${index + 1}@example.com`,
    active: index % 2 === 0,
    created_at: "2026-06-01T10:00:00",
    roles: [{ id: 2, name: index === 0 ? "ADMIN" : "EVALUADOR", permissions: [] }],
    direct_permissions: [],
  }));
}

describe("User management performance in browser", () => {
  it("renders and filters a large directory within stable thresholds", () => {
    // Arrange
    cy.intercept("GET", `${API_URL}/users/`, makeUsers(250)).as("getLargeUsers");
    const startedAt = Date.now();

    // Act
    visitAsAdmin("/account/users");
    cy.wait("@getLargeUsers");
    cy.contains("Perf User 250").should("be.visible");

    // Assert
    cy.wrap(null).then(() => {
      expect(Date.now() - startedAt).to.be.lessThan(5000);
    });

    const filterStartedAt = Date.now();
    cy.get('input[placeholder="Buscar por nombre o email..."]').type("perf-249@example.com");
    cy.contains("Perf User 249").should("be.visible");
    cy.wrap(null).then(() => {
      expect(Date.now() - filterStartedAt).to.be.lessThan(1500);
    });
  });
});
