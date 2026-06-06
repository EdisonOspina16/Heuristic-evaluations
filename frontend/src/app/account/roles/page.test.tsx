import { render, screen, waitFor } from "@testing-library/react";

import RolesManagementPage from "./page";
import { authService } from "@/features/auth/services/auth.service";

jest.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getToken: jest.fn(),
    getCurrentUser: jest.fn(),
    can: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe("RolesManagementPage", () => {
  beforeEach(() => {
    localStorage.setItem("access_token", "jwt-token");
    mockedAuthService.getToken.mockReset();
    mockedAuthService.getToken.mockReturnValue("jwt-token");
  });

  test("test_roles_page_renders_exactly_two_role_cards_with_security_message", async () => {
    // Arrange
    render(<RolesManagementPage />);

    // Act
    await waitFor(() => {
      expect(screen.getByText("ADMIN")).toBeInTheDocument();
      expect(screen.getByText("EVALUADOR")).toBeInTheDocument();
    });

    // Assert
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.getByText("11 Permisos")).toBeInTheDocument();
    expect(screen.getByText("3 Permisos")).toBeInTheDocument();
    expect(screen.getAllByText(/no puede ser modificado manualmente/i)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
  });

  test("test_roles_page_logs_error_when_token_lookup_fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAuthService.getToken.mockImplementation(() => {
      throw new Error("token lookup failed");
    });

    // Act
    render(<RolesManagementPage />);

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching roles", expect.any(Error));
    });
    expect(screen.queryByText("ADMIN")).toBeNull();
    consoleSpy.mockRestore();
  });
});
