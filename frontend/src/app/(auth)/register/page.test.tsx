import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import RegisterPage from "./page";
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

describe("RegisterPage", () => {
  beforeEach(() => {
    mockedAuthService.register.mockReset();
    mockedAuthService.login.mockReset();
  });

  test("test_register_step_1_renders_name_step_and_advances_progress_bar", async () => {
    // Arrange
    render(<RegisterPage />);

    const nameInput = screen.getByRole("textbox");
    const continueButton = screen.getByRole("button", { name: /continuar/i });
    const progressBar = screen.getByTestId("registration-progress");

    // Act
    fireEvent.change(nameInput, { target: { value: "Juan Perez" } });
    fireEvent.click(continueButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("register-step-2")).toBeInTheDocument();
    });
    expect(progressBar).toHaveStyle("width: 50%");
  });

  test("test_register_step_2_renders_email_step_and_advances_progress_bar", async () => {
    // Arrange
    render(<RegisterPage />);

    const nameInput = screen.getByRole("textbox");
    const continueButton = screen.getByRole("button", { name: /continuar/i });

    // Act
    fireEvent.change(nameInput, { target: { value: "Juan Perez" } });
    fireEvent.click(continueButton);

    const emailInput = await screen.findByPlaceholderText("juan@ejemplo.com");
    fireEvent.change(emailInput, { target: { value: "juan@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("register-step-3")).toBeInTheDocument();
    });
    expect(screen.getByTestId("registration-progress")).toHaveStyle("width: 100%");
  });
});
