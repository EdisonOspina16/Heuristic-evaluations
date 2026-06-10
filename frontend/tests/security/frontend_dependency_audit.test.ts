import { execSync } from "child_process";
import { expect } from "chai";

describe("Frontend Security | Análisis de Dependencias (SCA)", () => {
  it("npm audit no debe encontrar vulnerabilidades críticas o altas en las dependencias", () => {
    try {
      execSync("npm audit --audit-level=high", {
        encoding: "utf8",
        stdio: "pipe",
      });

      expect(true).to.be.true;
    } catch (error: any) {
      const output = error.stdout || error.message;
      throw new Error(
        `¡npm audit encontró dependencias con vulnerabilidades de seguridad!\n\n${output}`
      );
    }
  });
});
