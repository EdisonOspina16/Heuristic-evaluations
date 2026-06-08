import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Sidebar } from "@/components/layout/sidebar";
import { authService } from "@/features/auth/services/auth.service";
import { projectsService } from "@/features/projects/services/projects.service";
import { expectThat } from "./fluent";
import { adminUser, evaluatorUser } from "./user-management.fixtures";

jest.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock("@/features/projects/services/projects.service", () => ({
  projectsService: {
    getProjects: jest.fn(),
  },
}));

jest.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedProjectsService = projectsService as jest.Mocked<typeof projectsService>;

describe("Sidebar administration navigation", () => {
  beforeEach(() => {
    mockedProjectsService.getProjects.mockResolvedValue([]);
  });

  test("test_admin_user_sees_user_roles_and_permissions_links", async () => {
    // Arrange
    mockedAuthService.getCurrentUser.mockReturnValue(adminUser);

    // Act
    render(<Sidebar />);

    // Assert
    await waitFor(() => expect(screen.getByText("Administración")).toBeInTheDocument());
    expectThat(screen.getByRole("link", { name: /usuarios/i })).shouldBeInTheDocument();
    expectThat(screen.getByRole("link", { name: /roles/i })).shouldBeInTheDocument();
    expectThat(screen.getByRole("link", { name: /permisos globales/i })).shouldBeInTheDocument();
  });

  test("test_evaluator_user_does_not_see_administration_section", async () => {
    // Arrange
    mockedAuthService.getCurrentUser.mockReturnValue(evaluatorUser);

    // Act
    render(<Sidebar />);

    // Assert
    await waitFor(() => expect(screen.getByText("HeuristicApp")).toBeInTheDocument());
    expect(screen.queryByText("Administración")).toBeNull();
    expect(screen.queryByRole("link", { name: /usuarios/i })).toBeNull();
  });

  test("test_logout_clears_session_and_redirects_to_login", async () => {
    // Arrange
    mockedAuthService.getCurrentUser.mockReturnValue(adminUser);
    const pushMock = (globalThis as typeof globalThis & { __NEXT_PUSH_MOCK__?: jest.Mock }).__NEXT_PUSH_MOCK__;
    render(<Sidebar />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getByText("Ada Admin"));
    fireEvent.click(screen.getByText("Cerrar Sesión"));

    // Assert
    expect(mockedAuthService.logout).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  test("test_sidebar_handles_project_fetch_failure_without_breaking_admin_links", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAuthService.getCurrentUser.mockReturnValue(adminUser);
    mockedProjectsService.getProjects.mockRejectedValueOnce(new Error("projects down"));

    // Act
    render(<Sidebar />);

    // Assert
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith("Error fetching projects for sidebar", expect.any(Error)));
    expectThat(screen.getByRole("link", { name: /usuarios/i })).shouldBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
