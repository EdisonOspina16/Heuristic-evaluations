import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { expect as chaiExpect } from "chai";

import ProjectAssignmentsPage from "@/app/project/[id]/assignments/page";
import { authService } from "@/features/auth/services/auth.service";
import { evaluationsService } from "@/features/evaluations/services/evaluations.service";
import { projectsService } from "@/features/projects/services/projects.service";

jest.mock("axios");
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "10" }),
}));
jest.mock("@/features/auth/services/auth.service", () => ({
  authService: { getToken: jest.fn() },
}));
jest.mock("@/features/evaluations/services/evaluations.service", () => ({
  evaluationsService: { getPlantillas: jest.fn() },
}));
jest.mock("@/features/projects/services/projects.service", () => ({
  projectsService: { getAssignments: jest.fn(), saveAssignment: jest.fn() },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuth = authService as jest.Mocked<typeof authService>;
const mockedEvaluations = evaluationsService as jest.Mocked<typeof evaluationsService>;
const mockedProjects = projectsService as jest.Mocked<typeof projectsService>;

const users = [
  { id: 1, nombre: "Ada Admin", email: "ada@example.com", roles: [{ name: "ADMIN" }] },
  { id: 2, nombre: "Juan Perez", email: "juan@example.com", roles: [{ name: "EVALUADOR" }] },
  { id: 3, nombre: "Ana Torres", email: "ana@example.com", roles: [{ name: "EVALUADOR" }] },
];

const plantillas = [
  { id: 11, codigo: "UI", nombre: "UI", descripcion: "UI", version: 1, activa: true },
  { id: 12, codigo: "UX", nombre: "UX", descripcion: "UX", version: 1, activa: true },
  { id: 13, codigo: "ACC", nombre: "Accesibilidad", descripcion: "Accesibilidad", version: 1, activa: true },
];

describe("ProjectAssignmentsPage module 9", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAuth.getToken.mockReturnValue("jwt-token");
    mockedEvaluations.getPlantillas.mockReset();
    mockedProjects.getAssignments.mockReset();
    mockedProjects.saveAssignment.mockReset();
    mockedAxios.get.mockResolvedValue({ data: users });
    mockedEvaluations.getPlantillas.mockResolvedValue(plantillas as any);
    mockedProjects.getAssignments.mockResolvedValue([
      {
        id: 99,
        evaluator_id: 2,
        evaluator_name: "Juan Perez",
        evaluator_email: "juan@example.com",
        project_id: 10,
        role: "UI",
        allowed_evaluation_types: ["UI"],
      },
    ]);
  });

  test("TC-M9-UA01 renders only evaluators with existing focus and allowed templates", async () => {
    // Arrange + Act
    render(<ProjectAssignmentsPage />);

    // Assert
    await screen.findByText("Juan Perez");
    chaiExpect(screen.queryByText("Ada Admin")).to.equal(null);
    chaiExpect((screen.getAllByPlaceholderText("Enfoque: UI, UX, Accesibilidad...")[0] as HTMLInputElement).value).to.equal("UI");
    chaiExpect(screen.getAllByText("UI").length).to.be.greaterThan(0);
  });

  test("TC-M9-UA02 saves a new unrestricted general assignment", async () => {
    // Arrange
    mockedProjects.saveAssignment.mockResolvedValueOnce({
      id: 100,
      evaluator_id: 3,
      evaluator_name: "Ana Torres",
      evaluator_email: "ana@example.com",
      project_id: 10,
      role: "General",
      allowed_evaluation_types: [],
    });
    render(<ProjectAssignmentsPage />);
    await screen.findByText("Ana Torres");

    // Act
    fireEvent.click(screen.getAllByRole("button", { name: /guardar/i })[1]);

    // Assert
    await waitFor(() => {
      expect(mockedProjects.saveAssignment).toHaveBeenCalledWith(10, {
        evaluator_id: 3,
        role: "General",
        allowed_evaluation_types: [],
      });
    });
  });

  test("TC-M9-UA03 updates focus and multiple allowed types for an existing evaluator", async () => {
    // Arrange
    mockedProjects.saveAssignment.mockResolvedValueOnce({
      id: 99,
      evaluator_id: 2,
      evaluator_name: "Juan Perez",
      evaluator_email: "juan@example.com",
      project_id: 10,
      role: "UX",
      allowed_evaluation_types: ["UI", "UX", "Accesibilidad"],
    });
    render(<ProjectAssignmentsPage />);
    await screen.findByText("Juan Perez");

    // Act
    fireEvent.change(screen.getAllByPlaceholderText("Enfoque: UI, UX, Accesibilidad...")[0], {
      target: { value: "UX" },
    });
    fireEvent.click(screen.getAllByText("UX")[0]);
    fireEvent.click(screen.getAllByText("Accesibilidad")[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /guardar/i })[0]);

    // Assert
    await waitFor(() => {
      expect(mockedProjects.saveAssignment).toHaveBeenCalledWith(10, {
        id: 99,
        evaluator_id: 2,
        evaluator_name: "Juan Perez",
        evaluator_email: "juan@example.com",
        project_id: 10,
        role: "UX",
        allowed_evaluation_types: ["UI", "UX", "Accesibilidad"],
      });
    });
  });
});
