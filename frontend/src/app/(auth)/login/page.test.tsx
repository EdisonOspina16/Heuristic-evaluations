import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import LoginPage from "./page";
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

describe("LoginPage", () => {
  beforeEach(() => {
    mockedAuthService.login.mockReset();
  });

  test("test_login_with_inactive_user_shows_error_message_in_screen", async () => {
    // Arrange
    mockedAuthService.login.mockRejectedValueOnce({
      response: {
        data: {
          detail: "User account is inactive",
        },
      },
    });

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("tucorreo@ejemplo.com");
    const passwordInput = document.querySelector(
      'input[type="password"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: /iniciar/i });

    // Act
    fireEvent.change(emailInput, { target: { value: "maria@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Secret123!" } });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("User account is inactive");
    });

    const pushMock = (globalThis as typeof globalThis & {
      __NEXT_PUSH_MOCK__?: jest.Mock;
    }).__NEXT_PUSH_MOCK__;
    expect(pushMock).not.toHaveBeenCalled();
  });
});
