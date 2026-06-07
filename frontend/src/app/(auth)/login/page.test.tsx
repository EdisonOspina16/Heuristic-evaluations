import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { authService } from "@/features/auth/services/auth.service";
import LoginPage from "./page";


// ── Mocks globales 

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    login: jest.fn(),
  },
}));

// ── Helper 

const fillAndSubmit = async (email: string, password: string) => {
  fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.com"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
};

// ── Suite 

describe("LoginPage", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // RENDERIZADO INICIAL 

  describe("renderizado inicial", () => {

    test("TC-L01 — muestra todos los elementos del formulario", () => {
      // Arrange
      render(<LoginPage />);



      // Assert
      expect(screen.getByText("Bienvenido de nuevo")).toBeInTheDocument();
      expect(
        screen.getByText("Ingresa tus credenciales para acceder a tu cuenta")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("tucorreo@ejemplo.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /iniciar sesión/i })
      ).toBeInTheDocument();
    });

    test("TC-L02 — el botón de submit está habilitado por defecto", () => {
      // Arrange
      render(<LoginPage />);

      // Act
      const button = screen.getByRole("button", { name: /iniciar sesión/i });

      // Assert
      expect(button).not.toBeDisabled();
    });

    test("TC-L03 — no muestra mensaje de error en el estado inicial", () => {
      // Arrange
      render(<LoginPage />);

      // Act — (renderizado pasivo)

      // Assert
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("TC-L04 — el link 'Regístrate ahora' apunta a /register", () => {
      // Arrange
      render(<LoginPage />);

      // Act
      const link = screen.getByRole("link", { name: /regístrate ahora/i });

      // Assert
      expect(link).toHaveAttribute("href", "/register");
    });

    test("TC-L05 — el branding muestra el título en el panel izquierdo", () => {
      render(<LoginPage />);

      expect(screen.getByAltText("Heuristic Evaluations Logo")).toBeInTheDocument();
    });

  });

  // INTERACCIÓN CON CAMPOS 

  describe("interacción con campos", () => {

    test("TC-L06 — el campo email acepta entrada de texto", async () => {
      // Arrange
      render(<LoginPage />);
      const emailInput = screen.getByPlaceholderText("tucorreo@ejemplo.com");

      // Act
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      // Assert
      expect(emailInput).toHaveValue("test@example.com");
    });

    test("TC-L07 — el campo password acepta entrada y es de tipo password", async () => {
      // Arrange
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText("••••••••");

      // Act
      fireEvent.change(passwordInput, { target: { value: "secreto123" } });

      // Assert
      expect(passwordInput).toHaveValue("secreto123");
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("TC-L08 — el checkbox 'Recordarme' es interactuable", async () => {
      // Arrange
      render(<LoginPage />);
      const checkbox = screen.getByRole("checkbox");

      // Act
      fireEvent.click(checkbox);

      // Assert
      expect(checkbox).toBeChecked();
    });

  });

  // ── CAMINO FELIZ — LOGIN EXITOSO 

  describe("login exitoso", () => {

    test("TC-L09 — redirige a /dashboard cuando las credenciales son válidas", async () => {
      // Arrange
      (authService.login as jest.Mock).mockResolvedValueOnce({
        access_token: "token_abc",
        user: { id: 1, nombre: "Juan", email: "juan@test.com", rol: "evaluador" },
      });
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "password123");

      // Assert
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    test("TC-L10 — llama a authService.login con email y password correctos", async () => {
      // Arrange
      (authService.login as jest.Mock).mockResolvedValueOnce({});
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "password123");

      // Assert
      expect(authService.login).toHaveBeenCalledWith("juan@test.com", "password123");
    });

    test("TC-L11 — no muestra error después de un login exitoso", async () => {
      // Arrange
      (authService.login as jest.Mock).mockResolvedValueOnce({});
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "password123");

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

  });

  // ── ESTADO DE CARGA (N4 — setLoading true) ──────────────────────────────

  describe("estado de carga", () => {

    test("TC-L12 — el botón se deshabilita mientras carga", async () => {
      // Arrange
      (authService.login as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "password123");

      // Assert
      expect(screen.getByRole("button")).toBeDisabled();
    });

    test("TC-L13 — muestra el spinner Loader2 durante la carga", async () => {
      // Arrange
      (authService.login as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "password123");

      // Assert — el texto del botón desaparece y aparece el spinner (svg animado)
      expect(
        screen.queryByText(/iniciar sesión/i)
      ).not.toBeInTheDocument();
    });

    test("TC-L14 — loading vuelve a false después del login exitoso (finally)", async () => {
      // Arrange
      (authService.login as jest.Mock).mockResolvedValueOnce({});
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "password123");

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /iniciar sesión/i })
        ).not.toBeDisabled();
      });
    });

  });

  // ── ERROR DE CREDENCIALES (N6 No→N8) ────────────────────────────────────

  describe("error de credenciales", () => {

    test("TC-L15 — muestra el mensaje de error de la API cuando falla el login", async () => {
      // Arrange
      (authService.login as jest.Mock).mockRejectedValueOnce({
        response: { data: { detail: "Credenciales incorrectas" } },
      });
      render(<LoginPage />);

      // Act
      await fillAndSubmit("wrong@test.com", "wrongpass");

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Credenciales incorrectas");
      });
    });

    test("TC-L16 — muestra mensaje genérico cuando el error no trae detail", async () => {
      // Arrange
      (authService.login as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "password123");

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Error al iniciar sesión. Verifica tus credenciales."
        );
      });
    });

    test("TC-L17 — loading vuelve a false después de un error (finally)", async () => {
      // Arrange
      (authService.login as jest.Mock).mockRejectedValueOnce({
        response: { data: { detail: "Error 401" } },
      });
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "wrongpass");

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /iniciar sesión/i })
        ).not.toBeDisabled();
      });
    });

    test("TC-L18 — no redirige cuando el login falla", async () => {
      // Arrange
      (authService.login as jest.Mock).mockRejectedValueOnce({
        response: { data: { detail: "Unauthorized" } },
      });
      render(<LoginPage />);

      // Act
      await fillAndSubmit("juan@test.com", "wrongpass");

      // Assert
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    test("TC-L19 — el mensaje de error desaparece al enviar el formulario de nuevo", async () => {
      // Arrange
      (authService.login as jest.Mock)
        .mockRejectedValueOnce({ response: { data: { detail: "Error 401" } } })
        .mockResolvedValueOnce({});
      render(<LoginPage />);

      // Act — primer intento fallido
      await fillAndSubmit("juan@test.com", "wrong");
      await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

      // Act — segundo intento exitoso
      fireEvent.submit(screen.getByRole("button", { name: /iniciar sesión/i }).closest("form")!);

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

  });

  // ── VALIDACIÓN NATIVA HTML ───────────────────────────────────────────────

  describe("validación de campos requeridos", () => {

    test("TC-L20 — el campo email tiene atributo required", () => {
      // Arrange
      render(<LoginPage />);

      // Act
      const emailInput = screen.getByPlaceholderText("tucorreo@ejemplo.com");

      // Assert
      expect(emailInput).toBeRequired();
    });

    test("TC-L21 — el campo password tiene atributo required", () => {
      // Arrange
      render(<LoginPage />);

      // Act
      const passwordInput = screen.getByPlaceholderText("••••••••");

      // Assert
      expect(passwordInput).toBeRequired();
    });

    test("TC-L22 — el campo email tiene type=email", () => {
      // Arrange
      render(<LoginPage />);

      // Act
      const emailInput = screen.getByPlaceholderText("tucorreo@ejemplo.com");

      // Assert
      expect(emailInput).toHaveAttribute("type", "email");
    });

  });

});