import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authService } from "@/features/auth/services/auth.service";
import RegisterPage from "../../src/app/(auth)/register/page";

const userEvent = {
    click: async (element: Element) => {
        await act(async () => {
            fireEvent.click(element);
        });
    },
    type: async (element: Element, text: string) => {
        const enterPattern = /\{Enter\}/gi;
        const shouldEnter = enterPattern.test(text);
        const value = text.replace(enterPattern, "");

        await act(async () => {
            if (value) {
                fireEvent.change(element, { target: { value } });
            }
            if (shouldEnter) {
                fireEvent.keyDown(element, { key: "Enter", code: "Enter", charCode: 13 });
                fireEvent.keyPress(element, { key: "Enter", code: "Enter", charCode: 13 });
                fireEvent.keyUp(element, { key: "Enter", code: "Enter", charCode: 13 });
            }
        });
    },
};

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

const goToStep2 = async (nombre = "Juan Pérez") => {
    await userEvent.type(screen.getByPlaceholderText("Juan Pérez"), nombre);
    await userEvent.click(screen.getByRole("button", { name: /continuar/i }));
};

const goToStep3 = async (email = "juan@test.com") => {
    await userEvent.type(screen.getByPlaceholderText("juan@ejemplo.com"), email);
    await userEvent.click(screen.getByRole("button", { name: /continuar/i }));
};

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

describe("RegisterPage", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("renderizado inicial — step 1", () => {

        test("TC-R01 — muestra el encabezado y descripción de la página", () => {
            render(<RegisterPage />);
            expect(screen.getByText("Crea tu cuenta")).toBeInTheDocument();
            expect(screen.getByText("Únete a nuestra plataforma de evaluación heurística")).toBeInTheDocument();
        });

        test("TC-R02 — muestra el step 1 con el campo nombre por defecto", () => {
            render(<RegisterPage />);
            expect(screen.getByTestId("register-step-1")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Juan Pérez")).toBeInTheDocument();
            expect(screen.getByText("¿Cómo te llamas?")).toBeInTheDocument();
        });

        test("TC-R03 — el botón Continuar está deshabilitado cuando nombre está vacío", () => {
            render(<RegisterPage />);
            expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
        });

        test("TC-R04 — el link 'Inicia sesión aquí' apunta a /login", () => {
            render(<RegisterPage />);
            expect(screen.getByRole("link", { name: /inicia sesión aquí/i })).toHaveAttribute("href", "/login");
        });

        test("TC-R05 — no muestra error en el estado inicial", () => {
            render(<RegisterPage />);
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });

        test("TC-R06 — muestra los 3 indicadores de progreso", () => {
            render(<RegisterPage />);
            expect(screen.getByTestId("registration-progress")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument();
        });

    });

    describe("step 1 — campo nombre", () => {

        test("TC-R07 — el botón Continuar se habilita al escribir el nombre", async () => {
            render(<RegisterPage />);
            await userEvent.type(screen.getByPlaceholderText("Juan Pérez"), "Juan");
            expect(screen.getByRole("button", { name: /continuar/i })).not.toBeDisabled();
        });

        test("TC-R08 — avanza al step 2 al hacer click en Continuar con nombre válido", async () => {
            render(<RegisterPage />);
            await goToStep2();
            expect(screen.getByTestId("register-step-2")).toBeInTheDocument();
            expect(screen.queryByTestId("register-step-1")).not.toBeInTheDocument();
        });

        test("TC-R09 — NO avanza al step 2 si el nombre está vacío", async () => {
            render(<RegisterPage />);
            expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
            expect(screen.getByTestId("register-step-1")).toBeInTheDocument();
        });

        test("TC-R10 — avanza al step 2 al presionar Enter en el campo nombre", async () => {
            render(<RegisterPage />);
            await userEvent.type(screen.getByPlaceholderText("Juan Pérez"), "Juan Pérez{Enter}");
            expect(screen.getByTestId("register-step-2")).toBeInTheDocument();
        });

        test("TC-R11 — presionar Enter sin nombre no avanza de paso", async () => {
            render(<RegisterPage />);
            await userEvent.type(screen.getByPlaceholderText("Juan Pérez"), "{Enter}");
            expect(screen.getByTestId("register-step-1")).toBeInTheDocument();
        });

    });

    describe("step 2 — campo email", () => {

        test("TC-R12 — muestra el campo email al llegar al step 2", async () => {
            render(<RegisterPage />);
            await goToStep2();
            expect(screen.getByPlaceholderText("juan@ejemplo.com")).toBeInTheDocument();
            expect(screen.getByText("Tu correo electrónico")).toBeInTheDocument();
        });

        test("TC-R13 — el botón Continuar está deshabilitado con email vacío", async () => {
            render(<RegisterPage />);
            await goToStep2();
            expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
        });

        test("TC-R14 — avanza al step 3 con email válido", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await goToStep3();
            expect(screen.getByTestId("register-step-3")).toBeInTheDocument();
            expect(screen.queryByTestId("register-step-2")).not.toBeInTheDocument();
        });

        test("TC-R15 — avanza al step 3 al presionar Enter en el campo email", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await userEvent.type(screen.getByPlaceholderText("juan@ejemplo.com"), "juan@test.com{Enter}");
            expect(screen.getByTestId("register-step-3")).toBeInTheDocument();
        });

        test("TC-R16 — el botón Volver regresa al step 1", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await userEvent.click(screen.getByRole("button", { name: /volver/i }));
            expect(screen.getByTestId("register-step-1")).toBeInTheDocument();
            expect(screen.queryByTestId("register-step-2")).not.toBeInTheDocument();
        });

        test("TC-R17 — el campo email tiene type=email", async () => {
            render(<RegisterPage />);
            await goToStep2();
            expect(screen.getByPlaceholderText("juan@ejemplo.com")).toHaveAttribute("type", "email");
        });

    });

    describe("step 3 — campo password", () => {

        test("TC-R18 — muestra el campo password al llegar al step 3", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await goToStep3();
            expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
            expect(screen.getByText("Crea una contraseña segura")).toBeInTheDocument();
        });

        test("TC-R19 — el botón Finalizar Registro está deshabilitado con password vacío", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await goToStep3();
            expect(screen.getByRole("button", { name: /finalizar registro/i })).toBeDisabled();
        });

        test("TC-R20 — el botón Finalizar Registro se habilita al escribir la password", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await goToStep3();
            await userEvent.type(screen.getByPlaceholderText("••••••••"), "secret123");
            expect(screen.getByRole("button", { name: /finalizar registro/i })).not.toBeDisabled();
        });

        test("TC-R21 — el botón Volver desde step 3 regresa al step 2", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await goToStep3();
            await userEvent.click(screen.getByRole("button", { name: /volver/i }));
            expect(screen.getByTestId("register-step-2")).toBeInTheDocument();
            expect(screen.queryByTestId("register-step-3")).not.toBeInTheDocument();
        });

        test("TC-R22 — el campo password tiene type=password", async () => {
            render(<RegisterPage />);
            await goToStep2();
            await goToStep3();
            expect(screen.getByPlaceholderText("••••••••")).toHaveAttribute("type", "password");
        });

    });

    describe("registro exitoso", () => {

        test("TC-R23 — llama a authService.register con los datos correctos", async () => {
            (authService.register as jest.Mock).mockResolvedValueOnce({});
            (authService.login as jest.Mock).mockResolvedValueOnce({});
            render(<RegisterPage />);
            await completeForm("Juan Pérez", "juan@test.com", "secret123");
            await waitFor(() => {
                expect(authService.register).toHaveBeenCalledWith("Juan Pérez", "juan@test.com", "secret123");
            });
        });

        test("TC-R24 — llama a authService.login automáticamente después del registro", async () => {
            (authService.register as jest.Mock).mockResolvedValueOnce({});
            (authService.login as jest.Mock).mockResolvedValueOnce({});
            render(<RegisterPage />);
            await completeForm("Juan Pérez", "juan@test.com", "secret123");
            await waitFor(() => {
                expect(authService.login).toHaveBeenCalledWith("juan@test.com", "secret123");
            });
        });

        test("TC-R25 — redirige a /dashboard tras registro y login exitosos", async () => {
            (authService.register as jest.Mock).mockResolvedValueOnce({});
            (authService.login as jest.Mock).mockResolvedValueOnce({});
            render(<RegisterPage />);
            await completeForm();
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/dashboard");
            });
        });

        test("TC-R26 — no muestra error después de un registro exitoso", async () => {
            (authService.register as jest.Mock).mockResolvedValueOnce({});
            (authService.login as jest.Mock).mockResolvedValueOnce({});
            render(<RegisterPage />);
            await completeForm();
            await waitFor(() => {
                expect(screen.queryByRole("alert")).not.toBeInTheDocument();
            });
        });

    });

    describe("estado de carga durante el submit", () => {

        test("TC-R28 — oculta el texto 'Finalizar Registro' y muestra spinner durante carga", async () => {
            (authService.register as jest.Mock).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 500))
            );
            render(<RegisterPage />);
            await goToStep2();
            await goToStep3();
            await userEvent.type(screen.getByPlaceholderText("••••••••"), "secret123");
            await userEvent.click(screen.getByRole("button", { name: /finalizar registro/i }));
            await waitFor(() => {
                expect(screen.queryByText("Finalizar Registro")).not.toBeInTheDocument();
            });
        });

    });

    describe("error en el registro", () => {

        test("TC-R29 — muestra el mensaje de error de la API cuando register falla", async () => {
            (authService.register as jest.Mock).mockRejectedValueOnce({
                response: { data: { detail: "El email ya está registrado" } },
            });
            render(<RegisterPage />);
            await completeForm();
            await waitFor(() => {
                expect(screen.getByRole("alert")).toHaveTextContent("El email ya está registrado");
            });
        });

        test("TC-R30 — muestra mensaje genérico cuando el error no trae detail", async () => {
            (authService.register as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));
            render(<RegisterPage />);
            await completeForm();
            await waitFor(() => {
                expect(screen.getByRole("alert")).toHaveTextContent("Error al registrarse. Inténtalo de nuevo.");
            });
        });

        test("TC-R31 — loading vuelve a false después de un error", async () => {
            (authService.register as jest.Mock).mockRejectedValueOnce({
                response: { data: { detail: "Error 400" } },
            });
            render(<RegisterPage />);
            await completeForm();
            await waitFor(() => {
                expect(screen.getByRole("button", { name: /finalizar registro/i })).not.toBeDisabled();
            });
        });

        test("TC-R32 — no redirige cuando el registro falla", async () => {
            (authService.register as jest.Mock).mockRejectedValueOnce({
                response: { data: { detail: "Error 400" } },
            });
            render(<RegisterPage />);
            await completeForm();
            await waitFor(() => {
                expect(mockPush).not.toHaveBeenCalled();
            });
        });

        test("TC-R33 — muestra error cuando register OK pero auto-login falla", async () => {
            (authService.register as jest.Mock).mockResolvedValueOnce({});
            (authService.login as jest.Mock).mockRejectedValueOnce({
                response: { data: { detail: "Login fallido tras registro" } },
            });
            render(<RegisterPage />);
            await completeForm();
            await waitFor(() => {
                expect(screen.getByRole("alert")).toHaveTextContent("Login fallido tras registro");
            });
        });

    });

    describe("guard en handleSubmit", () => {

        test("TC-R34 — no llama a register si algún campo está vacío al hacer submit directo", async () => {
            render(<RegisterPage />);
            await goToStep2("Juan");
            await goToStep3("juan@test.com");
            await waitFor(() => {
                expect(authService.register).not.toHaveBeenCalled();
            });
        });

    });

    describe("barra de progreso", () => {

        test("TC-R35 — la barra de progreso existe en el DOM desde el inicio", () => {
            render(<RegisterPage />);
            expect(screen.getByTestId("registration-progress")).toBeInTheDocument();
        });

        test("TC-R36 — muestra el indicador numérico correcto en step 1", () => {
            render(<RegisterPage />);
            expect(screen.getByText("2")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument();
        });

    });

});