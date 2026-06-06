import axios from "axios";

import { authService } from "./auth.service";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedAxios.post.mockReset();
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

  test("test_login_without_access_token_does_not_persist_session", async () => {
    // Arrange
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token_type: "bearer",
        user: {
          id: 2,
          nombre: "Ana",
          email: "ana@example.com",
          rol: "EVALUADOR",
        },
      },
    });

    // Act
    const response = await authService.login("ana@example.com", "Secret123!");

    // Assert
    expect(response.token_type).toBe("bearer");
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("test_register_sends_expected_payload_and_returns_created_user", async () => {
    // Arrange
    const createdUser = {
      id: 3,
      nombre: "Luis",
      email: "luis@example.com",
      rol: "evaluador",
    };
    mockedAxios.post.mockResolvedValueOnce({
      data: createdUser,
    });

    // Act
    const response = await authService.register("Luis", "luis@example.com", "Secret123!");

    // Assert
    expect(response).toEqual(createdUser);
    expect(mockedAxios.post).toHaveBeenCalledWith("http://localhost:5000/auth/register", {
      nombre: "Luis",
      email: "luis@example.com",
      password: "Secret123!",
      rol: "evaluador",
    });
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

  test("test_getCurrentUser_returns_parsed_user_from_localStorage", () => {
    // Arrange
    const storedUser = {
      id: 4,
      nombre: "Camila",
      email: "camila@example.com",
      rol: "ADMIN",
    };
    localStorage.setItem("user", JSON.stringify(storedUser));

    // Act
    const currentUser = authService.getCurrentUser();

    // Assert
    expect(currentUser).toEqual(storedUser);
  });

  test("test_getCurrentUser_returns_null_and_logs_error_for_invalid_json", () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("user", "{invalid-json");

    // Act
    const currentUser = authService.getCurrentUser();

    // Assert
    expect(currentUser).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("test_getToken_prefers_access_token_over_token_fallback", () => {
    // Arrange
    localStorage.setItem("token", "fallback-token");
    localStorage.setItem("access_token", "primary-token");

    // Act
    const token = authService.getToken();

    // Assert
    expect(token).toBe("primary-token");
  });

  test("test_getToken_and_getCurrentUser_return_null_without_window", () => {
    // Arrange
    const originalWindow = (globalThis as typeof globalThis & { window?: Window }).window;
    delete (globalThis as typeof globalThis & { window?: Window }).window;

    try {
      // Act + Assert
      expect(authService.getToken()).toBeNull();
      expect(authService.getCurrentUser()).toBeNull();
    } finally {
      (globalThis as typeof globalThis & { window?: Window }).window = originalWindow;
    }
  });

  test.each([
    {
      label: "admin bypass",
      user: { id: 1, nombre: "Admin", email: "admin@example.com", rol: "ADMIN" },
      permission: "ANY_PERMISSION",
      expected: true,
    },
    {
      label: "explicit permission",
      user: {
        id: 2,
        nombre: "Eva",
        email: "eva@example.com",
        rol: "EVALUADOR",
        permissions: ["READ_REPORTS"],
      },
      permission: "READ_REPORTS",
      expected: true,
    },
    {
      label: "missing permission",
      user: {
        id: 3,
        nombre: "No Perm",
        email: "noperm@example.com",
        rol: "EVALUADOR",
        permissions: ["READ_REPORTS"],
      },
      permission: "MANAGE_USERS",
      expected: false,
    },
  ])("test_can_handles_$label", ({ user, permission, expected }) => {
    // Arrange
    localStorage.setItem("user", JSON.stringify(user));

    // Act
    const canAccess = authService.can(permission);

    // Assert
    expect(canAccess).toBe(expected);
  });

  test("test_can_returns_false_without_logged_user", () => {
    expect(authService.can("MANAGE_USERS")).toBe(false);
  });
});
