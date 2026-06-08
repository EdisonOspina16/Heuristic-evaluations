import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";

import GlobalPermissionsPage from "@/app/account/permissions/page";
import { authService } from "@/features/auth/services/auth.service";
import { expectThat } from "./fluent";
import { adminUser, evaluatorUser, permissionsApiPayload, usersApiPayload } from "./user-management.fixtures";

jest.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    getToken: jest.fn(),
    getCurrentUser: jest.fn(),
    can: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthService = authService as jest.Mocked<typeof authService>;

function seedSuccessfulFetch() {
  mockedAxios.get
    .mockResolvedValueOnce({ data: usersApiPayload })
    .mockResolvedValueOnce({ data: permissionsApiPayload });
}

describe("GlobalPermissionsPage", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.put.mockReset();
    mockedAuthService.getToken.mockReturnValue("jwt-token");
    mockedAuthService.getCurrentUser.mockReturnValue(adminUser);
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("test_non_admin_user_is_redirected_to_dashboard_without_fetching_admin_data", () => {
    // Arrange
    mockedAuthService.getCurrentUser.mockReturnValue(evaluatorUser);
    const pushMock = (globalThis as typeof globalThis & { __NEXT_PUSH_MOCK__?: jest.Mock }).__NEXT_PUSH_MOCK__;

    // Act
    render(<GlobalPermissionsPage />);

    // Assert
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  test("test_permissions_page_fetches_users_permissions_and_shows_initial_empty_selection", async () => {
    // Arrange
    seedSuccessfulFetch();

    // Act
    render(<GlobalPermissionsPage />);

    // Assert
    await waitFor(() => expect(screen.getByText("Seleccionar Usuario")).toBeInTheDocument());
    expectThat(screen.getByText("Ada Admin")).shouldBeInTheDocument();
    expectThat(screen.getByText("Selecciona un usuario para administrar sus permisos.")).shouldBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenNthCalledWith(1, "http://localhost:5000/users/", {
      headers: { Authorization: "Bearer jwt-token" },
    });
    expect(mockedAxios.get).toHaveBeenNthCalledWith(2, "http://localhost:5000/users/permissions/list", {
      headers: { Authorization: "Bearer jwt-token" },
    });
  });

  test("test_permissions_page_logs_error_and_finishes_loading_when_fetch_fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAxios.get.mockRejectedValueOnce(new Error("api down"));

    // Act
    render(<GlobalPermissionsPage />);

    // Assert
    await waitFor(() => expect(screen.getByText("Seleccionar Usuario")).toBeInTheDocument());
    expectThat(consoleSpy).shouldHaveBeenCalledWith("Error fetching data", expect.any(Error));
  });

  test("test_select_user_loads_direct_permissions_and_allows_toggle_then_save", async () => {
    // Arrange
    const usersWithDirectPermission = [
      {
        ...usersApiPayload[0],
        direct_permissions: [permissionsApiPayload[0]],
      },
    ];
    mockedAxios.get
      .mockResolvedValueOnce({ data: usersWithDirectPermission })
      .mockResolvedValueOnce({ data: permissionsApiPayload });
    mockedAxios.put.mockResolvedValueOnce({ data: { message: "ok" } });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<GlobalPermissionsPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getByText("Ada Admin"));
    fireEvent.click(screen.getByText("Eliminar usuarios"));
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    // Assert
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "http://localhost:5000/users/1/permissions",
        ["MANAGE_USERS", "DELETE_USERS"],
        { headers: { Authorization: "Bearer jwt-token" } }
      );
    });
    expectThat(alertSpy).shouldHaveBeenCalledWith("Permisos actualizados correctamente");
  });

  test("test_permission_from_role_is_visible_but_not_toggled_by_click", async () => {
    // Arrange
    const rolePermissionUser = {
      ...usersApiPayload[0],
      roles: [{ ...usersApiPayload[0].roles[0], permissions: [permissionsApiPayload[2]] }],
      direct_permissions: [],
    };
    mockedAxios.get
      .mockResolvedValueOnce({ data: [rolePermissionUser] })
      .mockResolvedValueOnce({ data: permissionsApiPayload });
    mockedAxios.put.mockResolvedValueOnce({ data: { message: "ok" } });
    render(<GlobalPermissionsPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getByText("Ada Admin"));
    fireEvent.click(screen.getByText("Asignar roles"));
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    // Assert
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "http://localhost:5000/users/1/permissions",
        [],
        { headers: { Authorization: "Bearer jwt-token" } }
      );
    });
    expectThat(screen.getByText("Desde Rol")).shouldBeInTheDocument();
  });

  test("test_save_without_selected_user_does_not_call_api", async () => {
    // Arrange
    seedSuccessfulFetch();
    render(<GlobalPermissionsPage />);
    await screen.findByText("Ada Admin");

    // Act
    expect(screen.queryByRole("button", { name: /guardar cambios/i })).toBeNull();

    // Assert
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  test("test_save_error_alerts_backend_detail", async () => {
    // Arrange
    seedSuccessfulFetch();
    mockedAxios.put.mockRejectedValueOnce({ response: { data: { detail: "Not enough permissions" } } });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<GlobalPermissionsPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getByText("Ada Admin"));
    fireEvent.click(screen.getByText("Gestionar usuarios"));
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    // Assert
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Not enough permissions"));
  });

  test("test_user_search_filters_permission_user_list", async () => {
    // Arrange
    seedSuccessfulFetch();
    render(<GlobalPermissionsPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "eva" } });

    // Assert
    expect(screen.queryByText("Ada Admin")).toBeNull();
    expectThat(screen.getByText("Eva Evaluator")).shouldBeInTheDocument();
  });
});
