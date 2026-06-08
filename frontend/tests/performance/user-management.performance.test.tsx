import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";

import UsersManagementPage from "@/app/account/users/page";
import { authService } from "@/features/auth/services/auth.service";
import { expectThat } from "../unit/fluent";

jest.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    getToken: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthService = authService as jest.Mocked<typeof authService>;

function makeUsers(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    nombre: `User ${index + 1}`,
    email: `user-${index + 1}@example.com`,
    active: index % 2 === 0,
    created_at: "2026-06-01T10:00:00",
    roles: [
      {
        id: 2,
        name: index === 0 ? "ADMIN" : "EVALUADOR",
        description: "Role",
        permissions: [],
      },
    ],
    direct_permissions: [],
  }));
}

describe("User management performance smoke tests", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAuthService.getToken.mockReturnValue("jwt-token");
  });

  test("test_realtime_search_filters_large_directory_under_reasonable_threshold", async () => {
    // Arrange
    mockedAxios.get.mockResolvedValueOnce({ data: makeUsers(200) });
    render(<UsersManagementPage />);
    await screen.findByText("User 200");
    const startedAt = performance.now();

    // Act
    fireEvent.change(
      screen.getByPlaceholderText("Buscar por nombre o email..."),
      {
        target: { value: "user-199@example.com" },
      },
    );
    await waitFor(() =>
      expect(screen.getByText("User 199")).toBeInTheDocument(),
    );
    const elapsedMs = performance.now() - startedAt;

    // Assert
    expect(elapsedMs).toBeLessThan(500);
    expect(screen.queryByText("User 1")).toBeNull();
  });
});
