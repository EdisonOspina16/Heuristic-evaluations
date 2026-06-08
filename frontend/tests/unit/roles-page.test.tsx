import { render, screen, waitFor } from "@testing-library/react";

import RolesManagementPage from "@/app/account/roles/page";
import { authService } from "@/features/auth/services/auth.service";
import { expectThat } from "./fluent";

jest.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    getToken: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe("RolesManagementPage user administration coverage", () => {
  beforeEach(() => {
    mockedAuthService.getToken.mockReset();
    mockedAuthService.getToken.mockReturnValue("jwt-token");
  });

  test("test_roles_page_renders_admin_and_evaluator_as_read_only_system_roles", async () => {
    // Arrange

    // Act
    render(<RolesManagementPage />);

    // Assert
    await waitFor(() => expect(screen.getByText("ADMIN")).toBeInTheDocument());
    expectThat(screen.getByText("EVALUADOR")).shouldBeInTheDocument();
    expectThat(screen.getByText("11 Permisos")).shouldBeInTheDocument();
    expectThat(screen.getByText("3 Permisos")).shouldBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
    expectThat(screen.getAllByText(/no puede ser modificado manualmente/i)).shouldHaveLength(2);
  });

  test("test_roles_page_handles_token_lookup_exception_as_empty_role_state", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAuthService.getToken.mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    // Act
    render(<RolesManagementPage />);

    // Assert
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith("Error fetching roles", expect.any(Error)));
    expect(screen.queryByText("ADMIN")).toBeNull();
    consoleSpy.mockRestore();
  });
});
