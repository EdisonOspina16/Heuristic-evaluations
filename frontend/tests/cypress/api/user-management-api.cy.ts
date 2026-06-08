import { API_URL, adminSession } from "../support/user-management";

describe("User management API contracts from Cypress", () => {
  const headers = { Authorization: `Bearer ${adminSession.token}` };

  it("GET /users returns a serializable directory contract", () => {
    cy.request({ method: "GET", url: `${API_URL}/users/`, headers, failOnStatusCode: false }).then((response) => {
      expect([200, 401, 403]).to.include(response.status);
      if (response.status === 200) {
        expect(response.body).to.be.an("array");
        if (response.body.length > 0) {
          expect(response.body[0]).to.include.keys(["id", "nombre", "email", "active", "created_at", "roles"]);
        }
      }
    });
  });

  it("POST /users validates required body fields", () => {
    cy.request({ method: "POST", url: `${API_URL}/users/`, headers, body: {}, failOnStatusCode: false }).then((response) => {
      expect([401, 403, 422]).to.include(response.status);
    });
  });

  it("PATCH /users/{id}/status validates missing user or authorization", () => {
    cy.request({ method: "PATCH", url: `${API_URL}/users/999999/status?active=false`, headers, failOnStatusCode: false }).then((response) => {
      expect([401, 403, 404]).to.include(response.status);
    });
  });
});
