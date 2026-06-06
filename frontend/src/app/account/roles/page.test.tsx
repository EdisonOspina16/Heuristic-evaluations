import { render, screen, waitFor } from "@testing-library/react";

import RolesManagementPage from "./page";

describe("RolesManagementPage", () => {
  beforeEach(() => {
    localStorage.setItem("access_token", "jwt-token");
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
    expect(screen.getByText(/roles no alterables/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
  });
});
