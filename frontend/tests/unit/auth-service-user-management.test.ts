import axios from "axios";
import { expect as chaiExpect } from "chai";

import { authService } from "@/features/auth/services/auth.service";
import { expectThat } from "./fluent";
import { adminUser, evaluatorUser } from "./user-management.fixtures";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("authService user administration permissions", () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
    localStorage.clear();
  });

  test("test_login_persists_admin_role_and_management_permissions", async () => {
    // Arrange
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: "jwt-token",
        token_type: "bearer",
        user: adminUser,
      },
    });

    // Act
    const result = await authService.login(adminUser.email, "Secret123!");

    // Assert
    expectThat(result.user.rol).shouldEqual("ADMIN");
    expectThat(localStorage.getItem("access_token")).shouldEqual("jwt-token");
    expectThat(authService.can("DELETE_USERS")).shouldBe(true);
  });

  test("test_evaluator_cannot_access_management_permission_without_explicit_permission", () => {
    // Arrange
    localStorage.setItem("user", JSON.stringify(evaluatorUser));

    // Act
    const canManageUsers = authService.can("MANAGE_USERS");

    // Assert
    expectThat(canManageUsers).shouldBe(false);
  });

  test("test_can_returns_false_when_no_user_is_logged_in", () => {
    // Arrange
    localStorage.removeItem("user");

    // Act
    const canManageUsers = authService.can("MANAGE_USERS");

    // Assert
    chaiExpect(canManageUsers).to.be.false;
  });

  test("test_get_token_uses_legacy_token_fallback_for_existing_sessions", () => {
    // Arrange
    localStorage.setItem("token", "legacy-token");

    // Act
    const token = authService.getToken();

    // Assert
    expectThat(token).shouldEqual("legacy-token");
  });
});
