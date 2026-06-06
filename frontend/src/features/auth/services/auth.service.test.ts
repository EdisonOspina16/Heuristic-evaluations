import axios from "axios";

import { authService } from "./auth.service";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("test_login_with_valid_credentials_saves_access_token_and_user_in_localStorage", async () => {
    // Arrange
    const responseUser = {
      id: 1,
      nombre: "Maria",
      email: "maria@example.com",
      rol: "ADMIN",
      permissions: ["MANAGE_USERS"],
    };
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: "jwt-token",
        token_type: "bearer",
        user: responseUser,
      },
    });

    // Act
    const response = await authService.login("maria@example.com", "Secret123!");

    // Assert
    expect(response.access_token).toBe("jwt-token");
    expect(localStorage.getItem("access_token")).toBe("jwt-token");
    expect(localStorage.getItem("token")).toBe("jwt-token");
    expect(localStorage.getItem("user")).toBe(JSON.stringify(responseUser));
  });

  test("test_logout_with_existing_session_clears_localStorage_completely", () => {
    // Arrange
    localStorage.setItem("access_token", "jwt-token");
    localStorage.setItem("token", "jwt-token");
    localStorage.setItem("user", JSON.stringify({ id: 1 }));
    localStorage.setItem("temporary", "value");

    // Act
    authService.logout();

    // Assert
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
