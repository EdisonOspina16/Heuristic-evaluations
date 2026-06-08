import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";

import UsersManagementPage from "@/app/account/users/page";
import { authService } from "@/features/auth/services/auth.service";
import { expectThat } from "./fluent";
import { usersApiPayload } from "./user-management.fixtures";

jest.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    getToken: jest.fn(),
    getCurrentUser: jest.fn(),
    can: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAuthService = authService as jest.Mocked<typeof authService>;

function mockUsersFetch(payload = usersApiPayload) {
  mockedAxios.get.mockResolvedValueOnce({ data: payload });
}

describe("UsersManagementPage", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAxios.patch.mockReset();
    mockedAxios.delete.mockReset();
    mockedAuthService.getToken.mockReturnValue("jwt-token");
    jest.spyOn(window, "alert").mockImplementation(() => {});
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("test_users_page_fetches_and_renders_complete_directory_metadata", async () => {
    // Arrange
    mockUsersFetch();

    // Act
    render(<UsersManagementPage />);

    // Assert
    await waitFor(() => expect(screen.getByText("Ada Admin")).toBeInTheDocument());
    expectThat(screen.getByText("eva@example.com")).shouldBeInTheDocument();
    expectThat(screen.getByText("ADMIN")).shouldBeInTheDocument();
    expectThat(screen.getByText("INACTIVO")).shouldBeInTheDocument();
    expectThat(screen.getByText("A")).shouldBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith("http://localhost:5000/users/", {
      headers: { Authorization: "Bearer jwt-token" },
    });
  });

  test("test_users_page_logs_error_and_stops_loading_when_fetch_fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAxios.get.mockRejectedValueOnce(new Error("network down"));

    // Act
    render(<UsersManagementPage />);

    // Assert
    await waitFor(() => expect(screen.getByText("No se encontraron usuarios.")).toBeInTheDocument());
    expectThat(consoleSpy).shouldHaveBeenCalledWith("Error fetching users", expect.any(Error));
  });

  test("test_users_search_filters_by_name_email_and_empty_state", async () => {
    // Arrange
    mockUsersFetch();
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");
    const search = screen.getByPlaceholderText("Buscar por nombre o email...");

    // Act + Assert
    fireEvent.change(search, { target: { value: "eva" } });
    expect(screen.queryByText("Ada Admin")).toBeNull();
    expectThat(screen.getByText("Eva Evaluator")).shouldBeInTheDocument();

    fireEvent.change(search, { target: { value: "norole@example.com" } });
    expectThat(screen.getByText("No Role User")).shouldBeInTheDocument();
    expectThat(screen.getAllByText("EVALUADOR")[0]).shouldBeInTheDocument();

    fireEvent.change(search, { target: { value: "missing user" } });
    expectThat(screen.getByText("No se encontraron usuarios.")).shouldBeInTheDocument();
  });

  test("test_create_user_success_posts_payload_closes_modal_resets_form_and_refetches", async () => {
    // Arrange
    mockUsersFetch();
    mockedAxios.post.mockResolvedValueOnce({ data: { id: 4 } });
    mockedAxios.get.mockResolvedValueOnce({ data: usersApiPayload });
    const { container } = render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getByRole("button", { name: /nuevo usuario/i }));
    fireEvent.change(screen.getByPlaceholderText("Fullname"), { target: { value: "New Admin" } });
    fireEvent.change(screen.getByPlaceholderText("user@ejemplo.com"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "Secret123!" } });
    fireEvent.change(container.querySelector("select") as HTMLSelectElement, { target: { value: "ADMIN" } });
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }));

    // Assert
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:5000/users/?role_name=ADMIN",
        { nombre: "New Admin", email: "new@example.com", password: "Secret123!" },
        { headers: { Authorization: "Bearer jwt-token" } }
      );
    });
    await waitFor(() => expect(screen.queryByText("Crear Nuevo Usuario")).toBeNull());
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test("test_create_user_error_alerts_api_detail_and_keeps_modal_available", async () => {
    // Arrange
    mockUsersFetch();
    mockedAxios.post.mockRejectedValueOnce({ response: { data: { detail: "Email already registered" } } });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getByRole("button", { name: /nuevo usuario/i }));
    fireEvent.change(screen.getByPlaceholderText("Fullname"), { target: { value: "Duplicate" } });
    fireEvent.change(screen.getByPlaceholderText("user@ejemplo.com"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "Secret123!" } });
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }));

    // Assert
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Email already registered"));
    expectThat(screen.getByText("Crear Nuevo Usuario")).shouldBeInTheDocument();
  });

  test("test_toggle_status_success_calls_patch_with_opposite_state_and_refetches", async () => {
    // Arrange
    mockUsersFetch();
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });
    mockedAxios.get.mockResolvedValueOnce({ data: usersApiPayload });
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getAllByTitle("Desactivar")[0]);

    // Assert
    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "http://localhost:5000/users/1/status?active=false",
        {},
        { headers: { Authorization: "Bearer jwt-token" } }
      );
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test("test_toggle_status_error_alerts_detail_without_refetching", async () => {
    // Arrange
    mockUsersFetch();
    mockedAxios.patch.mockRejectedValueOnce({ response: { data: { detail: "Cannot deactivate the last active administrator" } } });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getAllByTitle("Desactivar")[0]);

    // Assert
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Cannot deactivate the last active administrator"));
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test("test_delete_user_cancel_does_not_call_api", async () => {
    // Arrange
    mockUsersFetch();
    jest.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);

    // Assert
    expect(mockedAxios.delete).not.toHaveBeenCalled();
  });

  test("test_delete_user_success_calls_delete_and_refetches", async () => {
    // Arrange
    mockUsersFetch();
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });
    mockedAxios.get.mockResolvedValueOnce({ data: usersApiPayload });
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getAllByTitle("Eliminar")[1]);

    // Assert
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith("http://localhost:5000/users/2", {
        headers: { Authorization: "Bearer jwt-token" },
      });
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test("test_delete_user_error_alerts_detail", async () => {
    // Arrange
    mockUsersFetch();
    mockedAxios.delete.mockRejectedValueOnce({ response: { data: { detail: "Cannot delete the last administrator" } } });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getAllByTitle("Eliminar")[0]);

    // Assert
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Cannot delete the last administrator"));
  });

  test("test_create_modal_cancel_closes_without_posting", async () => {
    // Arrange
    mockUsersFetch();
    render(<UsersManagementPage />);
    await screen.findByText("Ada Admin");

    // Act
    fireEvent.click(screen.getByRole("button", { name: /nuevo usuario/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    // Assert
    expect(screen.queryByText("Crear Nuevo Usuario")).toBeNull();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
