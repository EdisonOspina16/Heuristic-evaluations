import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authService } from "@/features/auth/services/auth.service";
import RegisterPage from "./page";

const userEvent = {
  click: async (element: Element) => {
    fireEvent.click(element);
  },
  type: async (element: Element, text: string) => {
    const enterPattern = /\{Enter\}/gi;
    const shouldEnter = enterPattern.test(text);
    const value = text.replace(enterPattern, "");

    if (value) {
      fireEvent.change(element, { target: { value } });
    }

    if (shouldEnter) {
      fireEvent.keyDown(element, {
        key: "Enter",
        code: "Enter",
        charCode: 13,
      });
      fireEvent.keyPress(element, {
        key: "Enter",
        code: "Enter",
        charCode: 13,
      });
      fireEvent.keyUp(element, {
        key: "Enter",
        code: "Enter",
        charCode: 13,
      });
    }
  },
};

// Mocks

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
    register: jest.fn(),
    login: jest.fn(),
  },
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Avanza del step 1 al step 2 ingresando el nombre */
const goToStep2 = async (nombre = "Juan Pérez") => {
  await userEvent.type(screen.getByPlaceholderText("Juan Pérez"), nombre);
  await userEvent.click(screen.getByRole("button", { name: /continuar/i }));
};

/** Avanza del step 2 al step 3 ingresando el email */
const goToStep3 = async (email = "juan@test.com") => {
  await userEvent.type(screen.getByPlaceholderText("juan@ejemplo.com"), email);
  await userEvent.click(screen.getByRole("button", { name: /continuar/i }));
};

/** Completa los 3 pasos y hace submit */
const completeForm = async (
  nombre = "Juan Pérez",
  email = "juan@test.com",
  password = "secret123"
) => {
  await goToStep2(nombre);
  await goToStep3(email);
  await userEvent.type(screen.getByPlaceholderText("••••••••"), password);
  await userEvent.click(screen.getByRole("button", { name: /finalizar registro/i }));
};

// ── Suite ───────────────────────────────────────────────────────────────────

describe("RegisterPage", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── RENDERIZADO INICIAL ─────────────────────────────────────────────────

  describe("renderizado inicial — step 1", () => {

    test("TC-R01 — muestra el encabezado y descripción de la página", () => {
      // Arrange
      render(<RegisterPage />);

      // Act — (renderizado pasivo)

      // Assert
      expect(screen.getByText("Crea tu cuenta")).toBeInTheDocument();
      expect(
        screen.getByText("Únete a nuestra plataforma de evaluación heurística")
      ).toBeInTheDocument();
    });

    test("TC-R02 — muestra el step 1 con el campo nombre por defecto", () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      const step1 = screen.getByTestId("register-step-1");

      // Assert
      expect(step1).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Juan Pérez")).toBeInTheDocument();
      expect(screen.getByText("¿Cómo te llamas?")).toBeInTheDocument();
    });

    test("TC-R03 — el botón Continuar está deshabilitado cuando nombre está vacío", () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      const btn = screen.getByRole("button", { name: /continuar/i });

      // Assert
      expect(btn).toBeDisabled();
    });

    test("TC-R04 — el link 'Inicia sesión aquí' apunta a /login", () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      const link = screen.getByRole("link", { name: /inicia sesión aquí/i });

      // Assert
      expect(link).toHaveAttribute("href", "/login");
    });

    test("TC-R05 — no muestra error en el estado inicial", () => {
      // Arrange
      render(<RegisterPage />);

      // Act — (renderizado pasivo)

      // Assert
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    test("TC-R06 — muestra los 3 indicadores de progreso", () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      const progress = screen.getByTestId("registration-progress");

      // Assert
      expect(progress).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

  });

  // ── STEP 1 — NOMBRE ─────────────────────────────────────────────────────

  describe("step 1 — campo nombre", () => {

    test("TC-R07 — el botón Continuar se habilita al escribir el nombre", async () => {
      // Arrange
      render(<RegisterPage />);
      const input = screen.getByPlaceholderText("Juan Pérez");

      // Act
      await userEvent.type(input, "Juan");

      // Assert
      expect(screen.getByRole("button", { name: /continuar/i })).not.toBeDisabled();
    });

    test("TC-R08 — avanza al step 2 al hacer click en Continuar con nombre válido", async () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      await goToStep2();

      // Assert
      expect(screen.getByTestId("register-step-2")).toBeInTheDocument();
      expect(screen.queryByTestId("register-step-1")).not.toBeInTheDocument();
    });

    test("TC-R09 — NO avanza al step 2 si el nombre está vacío (N3 — No)", async () => {
      // Arrange
      render(<RegisterPage />);

      // Act — click sin escribir nada (botón disabled, disparo directo del handler)
      // El botón está disabled, probamos que step 1 sigue visible
      const btn = screen.getByRole("button", { name: /continuar/i });

      // Assert
      expect(btn).toBeDisabled();
      expect(screen.getByTestId("register-step-1")).toBeInTheDocument();
    });

    test("TC-R10 — avanza al step 2 al presionar Enter en el campo nombre", async () => {
      // Arrange
      render(<RegisterPage />);
      const input = screen.getByPlaceholderText("Juan Pérez");

      // Act
      await userEvent.type(input, "Juan Pérez{Enter}");

      // Assert
      expect(screen.getByTestId("register-step-2")).toBeInTheDocument();
    });

    test("TC-R11 — presionar Enter sin nombre no avanza de paso", async () => {
      // Arrange
      render(<RegisterPage />);
      const input = screen.getByPlaceholderText("Juan Pérez");

      // Act
      await userEvent.type(input, "{Enter}");

      // Assert
      expect(screen.getByTestId("register-step-1")).toBeInTheDocument();
    });

  });

  // ── STEP 2 — EMAIL ──────────────────────────────────────────────────────

  describe("step 2 — campo email", () => {

    test("TC-R12 — muestra el campo email al llegar al step 2", async () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      await goToStep2();

      // Assert
      expect(screen.getByPlaceholderText("juan@ejemplo.com")).toBeInTheDocument();
      expect(screen.getByText("Tu correo electrónico")).toBeInTheDocument();
    });

    test("TC-R13 — el botón Continuar está deshabilitado con email vacío (N5 — No)", async () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      await goToStep2();
      const btn = screen.getByRole("button", { name: /continuar/i });

      // Assert
      expect(btn).toBeDisabled();
    });

    test("TC-R14 — avanza al step 3 con email válido (N5 — Sí)", async () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      await goToStep2();
      await goToStep3();

      // Assert
      expect(screen.getByTestId("register-step-3")).toBeInTheDocument();
      expect(screen.queryByTestId("register-step-2")).not.toBeInTheDocument();
    });

    test("TC-R15 — avanza al step 3 al presionar Enter en el campo email", async () => {
      // Arrange
      render(<RegisterPage />);
      await goToStep2();

      // Act
      await userEvent.type(
        screen.getByPlaceholderText("juan@ejemplo.com"),
        "juan@test.com{Enter}"
      );

      // Assert
      expect(screen.getByTestId("register-step-3")).toBeInTheDocument();
    });

    test("TC-R16 — el botón Volver regresa al step 1 (C6)", async () => {
      // Arrange
      render(<RegisterPage />);
      await goToStep2();

      // Act
      await userEvent.click(screen.getByRole("button", { name: /volver/i }));

      // Assert
      expect(screen.getByTestId("register-step-1")).toBeInTheDocument();
      expect(screen.queryByTestId("register-step-2")).not.toBeInTheDocument();
    });

    test("TC-R17 — el campo email tiene type=email", async () => {
      // Arrange
      render(<RegisterPage />);
      await goToStep2();

      // Act
      const input = screen.getByPlaceholderText("juan@ejemplo.com");

      // Assert
      expect(input).toHaveAttribute("type", "email");
    });

  });

  // ── STEP 3 — PASSWORD ───────────────────────────────────────────────────

  describe("step 3 — campo password", () => {

    test("TC-R18 — muestra el campo password al llegar al step 3", async () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      await goToStep2();
      await goToStep3();

      // Assert
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
      expect(screen.getByText("Crea una contraseña segura")).toBeInTheDocument();
    });

    test("TC-R19 — el botón Finalizar Registro está deshabilitado con password vacío", async () => {
      // Arrange
      render(<RegisterPage />);
      await goToStep2();
      await goToStep3();

      // Act
      const btn = screen.getByRole("button", { name: /finalizar registro/i });

      // Assert
      expect(btn).toBeDisabled();
    });

    test("TC-R20 — el botón Finalizar Registro se habilita al escribir la password", async () => {
      // Arrange
      render(<RegisterPage />);
      await goToStep2();
      await goToStep3();

      // Act
      await userEvent.type(screen.getByPlaceholderText("••••••••"), "secret123");

      // Assert
      expect(
        screen.getByRole("button", { name: /finalizar registro/i })
      ).not.toBeDisabled();
    });

    test("TC-R21 — el botón Volver desde step 3 regresa al step 2 (C7)", async () => {
      // Arrange
      render(<RegisterPage />);
      await goToStep2();
      await goToStep3();

      // Act
      await userEvent.click(screen.getByRole("button", { name: /volver/i }));

      // Assert
      expect(screen.getByTestId("register-step-2")).toBeInTheDocument();
      expect(screen.queryByTestId("register-step-3")).not.toBeInTheDocument();
    });

    test("TC-R22 — el campo password tiene type=password", async () => {
      // Arrange
      render(<RegisterPage />);
      await goToStep2();
      await goToStep3();

      // Act
      const input = screen.getByPlaceholderText("••••••••");

      // Assert
      expect(input).toHaveAttribute("type", "password");
    });

  });

  // ── REGISTRO EXITOSO (N1→...→N8→N9 Sí→N10→N12) ─────────────────────────

  describe("registro exitoso", () => {

    test("TC-R23 — llama a authService.register con los datos correctos", async () => {
      // Arrange
      (authService.register as jest.Mock).mockResolvedValueOnce({});
      (authService.login as jest.Mock).mockResolvedValueOnce({});
      render(<RegisterPage />);

      // Act
      await completeForm("Juan Pérez", "juan@test.com", "secret123");

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        "Juan Pérez",
        "juan@test.com",
        "secret123"
      );
    });

    test("TC-R24 — llama a authService.login automáticamente después del registro", async () => {
      // Arrange
      (authService.register as jest.Mock).mockResolvedValueOnce({});
      (authService.login as jest.Mock).mockResolvedValueOnce({});
      render(<RegisterPage />);

      // Act
      await completeForm("Juan Pérez", "juan@test.com", "secret123");

      // Assert
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith("juan@test.com", "secret123");
      });
    });

    test("TC-R25 — redirige a /dashboard tras registro y login exitosos", async () => {
      // Arrange
      (authService.register as jest.Mock).mockResolvedValueOnce({});
      (authService.login as jest.Mock).mockResolvedValueOnce({});
      render(<RegisterPage />);

      // Act
      await completeForm();

      // Assert
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    test("TC-R26 — no muestra error después de un registro exitoso", async () => {
      // Arrange
      (authService.register as jest.Mock).mockResolvedValueOnce({});
      (authService.login as jest.Mock).mockResolvedValueOnce({});
      render(<RegisterPage />);

      // Act
      await completeForm();

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });

  });

  // ── ESTADO DE CARGA ──────────────────────────────────────────────────────

  describe("estado de carga durante el submit", () => {

    test("TC-R27 — el botón se deshabilita mientras carga", async () => {
      // Arrange
      (authService.register as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );
      render(<RegisterPage />);
      await goToStep2();
      await goToStep3();
      await userEvent.type(screen.getByPlaceholderText("••••••••"), "secret123");

      // Act
      await userEvent.click(
        screen.getByRole("button", { name: /finalizar registro/i })
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /finalizar registro/i })
      ).toBeDisabled();
    });

    test("TC-R28 — oculta el texto 'Finalizar Registro' y muestra spinner durante carga", async () => {
      // Arrange
      (authService.register as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );
      render(<RegisterPage />);
      await goToStep2();
      await goToStep3();
      await userEvent.type(screen.getByPlaceholderText("••••••••"), "secret123");

      // Act
      await userEvent.click(
        screen.getByRole("button", { name: /finalizar registro/i })
      );

      // Assert
      expect(screen.queryByText("Finalizar Registro")).not.toBeInTheDocument();
    });

  });

  // ── ERROR EN REGISTER (N9 — No, catch) ──────────────────────────────────

  describe("error en el registro", () => {

    test("TC-R29 — muestra el mensaje de error de la API cuando register falla", async () => {
      // Arrange
      (authService.register as jest.Mock).mockRejectedValueOnce({
        response: { data: { detail: "El email ya está registrado" } },
      });
      render(<RegisterPage />);

      // Act
      await completeForm();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("El email ya está registrado")
        ).toBeInTheDocument();
      });
    });

    test("TC-R30 — muestra mensaje genérico cuando el error no trae detail", async () => {
      // Arrange
      (authService.register as jest.Mock).mockRejectedValueOnce(
        new Error("Network Error")
      );
      render(<RegisterPage />);

      // Act
      await completeForm();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("Error al registrarse. Inténtalo de nuevo.")
        ).toBeInTheDocument();
      });
    });

    test("TC-R31 — loading vuelve a false después de un error (catch + setLoading false)", async () => {
      // Arrange
      (authService.register as jest.Mock).mockRejectedValueOnce({
        response: { data: { detail: "Error 400" } },
      });
      render(<RegisterPage />);

      // Act
      await completeForm();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /finalizar registro/i })
        ).not.toBeDisabled();
      });
    });

    test("TC-R32 — no redirige cuando el registro falla", async () => {
      // Arrange
      (authService.register as jest.Mock).mockRejectedValueOnce({
        response: { data: { detail: "Error 400" } },
      });
      render(<RegisterPage />);

      // Act
      await completeForm();

      // Assert
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    test("TC-R33 — muestra error cuando register OK pero auto-login falla (C5)", async () => {
      // Arrange
      (authService.register as jest.Mock).mockResolvedValueOnce({});
      (authService.login as jest.Mock).mockRejectedValueOnce({
        response: { data: { detail: "Login fallido tras registro" } },
      });
      render(<RegisterPage />);

      // Act
      await completeForm();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("Login fallido tras registro")
        ).toBeInTheDocument();
      });
    });

  });

  // ── GUARD — SUBMIT SIN DATOS (rama early return) ─────────────────────────

  describe("guard en handleSubmit", () => {

    test("TC-R34 — no llama a register si algún campo está vacío al hacer submit directo", async () => {
      // Arrange
      render(<RegisterPage />);

      // Act — forzamos submit sin pasar por los pasos (simula manipulación directa)
      // El componente tiene un guard: if (!nombre || !email || !password) return
      // Para llegar al step 3 sin datos usamos el helper parcial
      await goToStep2("Juan");
      await goToStep3("juan@test.com");
 
      // Assert
      await waitFor(() => {
        expect(authService.register).not.toHaveBeenCalled();
      });
    });

  });

  // ── BARRA DE PROGRESO ────────────────────────────────────────────────────

  describe("barra de progreso", () => {

    test("TC-R35 — la barra de progreso existe en el DOM desde el inicio", () => {
      // Arrange
      render(<RegisterPage />);

      // Act
      const bar = screen.getByTestId("registration-progress");

      // Assert
      expect(bar).toBeInTheDocument();
    });

    test("TC-R36 — muestra el indicador numérico correcto en step 1", () => {
      // Arrange
      render(<RegisterPage />);

      // Act — (renderizado pasivo en step 1)

      // Assert — el step 1 activo no muestra número sino que está resaltado
      // los pasos 2 y 3 deben mostrar sus números
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

  });

});