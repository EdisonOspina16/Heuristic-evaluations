import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { expect as chaiExpect } from "chai";

import ProjectAssignmentsPage from "@/app/project/[id]/assignments/page";
import { authService } from "@/features/auth/services/auth.service";
import { evaluationsService } from "@/features/evaluations/services/evaluations.service";
import { projectsService } from "@/features/projects/services/projects.service";

jest.mock("axios");
jest.mock("next/navigation", () => ({ useParams: () => ({ id: "10" }) }));
jest.mock("@/features/auth/services/auth.service", () => ({ authService: { getToken: jest.fn() } }));
jest.mock("@/features/evaluations/services/evaluations.service", () => ({ evaluationsService: { getPlantillas: jest.fn() } }));
jest.mock("@/features/projects/services/projects.service", () => ({ projectsService: { getAssignments: jest.fn(), saveAssignment: jest.fn() } }));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuth = authService as jest.Mocked<typeof authService>;
const mockedEvaluations = evaluationsService as jest.Mocked<typeof evaluationsService>;
const mockedProjects = projectsService as jest.Mocked<typeof projectsService>;

test("module 9 assignments page renders a large evaluator/template matrix under a reasonable threshold", async () => {
  // Arrange
  const users = Array.from({ length: 40 }, (_, index) => ({
    id: index + 1,
    nombre: `Evaluador ${index + 1}`,
    email: `evaluador${index + 1}@example.com`,
    roles: [{ name: "EVALUADOR" }],
  }));
  const plantillas = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    codigo: `P${index + 1}`,
    nombre: `Tipo ${index + 1}`,
    descripcion: "Plantilla de prueba",
    version: 1,
    activa: true,
  }));
  mockedAuth.getToken.mockReturnValue("jwt-token");
  mockedAxios.get.mockResolvedValue({ data: users });
  mockedEvaluations.getPlantillas.mockResolvedValue(plantillas as any);
  mockedProjects.getAssignments.mockResolvedValue([]);

  // Act
  const startedAt = performance.now();
  render(<ProjectAssignmentsPage />);
  await screen.findByText("Evaluador 40");
  const elapsedMs = performance.now() - startedAt;

  // Assert
  await waitFor(() => chaiExpect(screen.getAllByText("Guardar")).to.have.length(40));
  chaiExpect(elapsedMs).to.be.lessThan(1500);
});
