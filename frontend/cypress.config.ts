import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: true,

  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
    env: {
      apiUrl: process.env.CYPRESS_API_URL || "http://localhost:5000",
    },
    specPattern: [
      "cypress/e2e/**/*.cy.ts",
      "cypress/accessibility/**/*.cy.ts",
      "cypress/smoke/**/*.cy.ts",
    ],
  },

});
