import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect as chaiExpect } from "chai";

import DashboardPage from "@/app/dashboard/page";
import { authService } from "@/features/auth/services/auth.service";
import { evaluationsService } from "@/features/evaluations/services/evaluations.service";
import { projectsService } from "@/features/projects/services/projects.service";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
jest.mock("@/features/auth/services/auth.service", () => ({
  authService: { getCurrentUser: jest.fn(), can: jest.fn() },
}));
jest.mock("@/features/evaluations/services/evaluations.service", () => ({
  evaluationsService: { getPlantillas: jest.fn(), getEvaluationsByProject: jest.fn() },
}));
jest.mock("@/features/projects/services/projects.service", () => ({
  projectsService: { getProjects: jest.fn(), getAssignments: jest.fn(), createProject: jest.fn() },
}));

const mockedAuth = authService as jest.Mocked<typeof authService>;
const mockedEvaluations = evaluationsService as jest.Mocked<typeof evaluationsService>;
const mockedProjects = projectsService as jest.Mocked<typeof projectsService>;

const plantillas = [
  { id: 1, codigo: "UI", nombre: "UI", descripcion: "Interfaz", version: 1, activa: true },
  { id: 2, codigo: "UX", nombre: "UX", descripcion: "Experiencia", version: 1, activa: true },
  { id: 3, codigo: "ACC", nombre: "Accesibilidad", descripcion: "Accesibilidad", version: 1, activa: true },
];

describe("Dashboard module 9 visibility and allowed type control", () => {
  beforeEach(() => {
    push.mockReset();
    mockedAuth.getCurrentUser.mockReturnValue({ id: 7, nombre: "Juan Perez", email: "juan@example.com", rol: "EVALUADOR" });
    mockedAuth.can.mockImplementation((permission) => permission === "CREATE_PROJECTS" ? false : false);
    mockedEvaluations.getPlantillas.mockResolvedValue(plantillas as any);
    mockedEvaluations.getEvaluationsByProject.mockResolvedValue([]);
    mockedProjects.getProjects.mockResolvedValue([
      { id: 10, nombre: "Proyecto A", descripcion: "Asignado", cliente: "QA", creado_por: 1, created_at: "2026-06-10T10:00:00" },
      { id: 20, nombre: "Proyecto B", descripcion: "Propio", cliente: "QA", creado_por: 7, created_at: "2026-06-10T11:00:00" },
    ]);
    mockedProjects.getAssignments.mockImplementation(async (projectId) => {
      if (projectId === 10) {
        return [{ id: 1, evaluator_id: 7, evaluator_name: "Juan Perez", evaluator_email: "juan@example.com", project_id: 10, role: "UI", allowed_evaluation_types: ["UI"] }];
      }
      return [];
    });
  });

  test("TC-M9-FU01 blocks continuing when selected template is not allowed for the assignment", async () => {
    // Arrange
    render(<DashboardPage />);
    await screen.findByText("UX");

    // Act
    fireEvent.click(screen.getAllByRole("button", { name: /comenzar evaluaci/i })[1]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "10" } });

    // Assert
    chaiExpect(await screen.findByText("Esta plantilla no est\u00e1 asignada a tu enfoque en este proyecto.")).to.exist;
    chaiExpect(screen.getByRole("button", { name: /continuar/i })).to.have.property("disabled", true);
    expect(push).not.toHaveBeenCalled();
  });

  test("TC-M9-FU02 allows continuing when the selected template is included in allowed types", async () => {
    // Arrange
    render(<DashboardPage />);
    await screen.findByText("UI");

    // Act
    fireEvent.click(screen.getAllByRole("button", { name: /comenzar evaluaci/i })[0]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Assert
    await waitFor(() => expect(push).toHaveBeenCalledWith("/evaluacion/1?project_id=10"));
  });

  test("TC-M9-FU03 allows any template when the evaluator has no type restrictions", async () => {
    // Arrange
    render(<DashboardPage />);
    await waitFor(() => chaiExpect(screen.getAllByText("Accesibilidad").length).to.be.greaterThan(0));

    // Act
    fireEvent.click(screen.getAllByRole("button", { name: /comenzar evaluaci/i })[2]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Assert
    await waitFor(() => expect(push).toHaveBeenCalledWith("/evaluacion/3?project_id=20"));
  });
});
