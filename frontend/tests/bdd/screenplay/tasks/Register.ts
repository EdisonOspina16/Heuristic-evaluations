import { Task, Wait } from "@serenity-js/core";
import { isVisible, By, Click, Enter, Navigate, PageElement } from "@serenity-js/web";
import { LoginPage } from "./Login";

export const RegisterPage = {
    nameField: () =>
        PageElement.located(By.css('[data-testid="register-step-1"] input[type="text"]')).describedAs("campo nombre"),
    step1ContinueButton: () =>
        PageElement.located(By.css('[data-testid="register-step-1"] button[type="button"]')).describedAs("botón continuar paso 1"),
    emailField: () =>
        PageElement.located(By.css('[data-testid="register-step-2"] input[type="email"]')).describedAs("campo email"),
    step2ContinueButton: () =>
        PageElement.located(By.css('[data-testid="register-step-2"] button[type="button"]:last-of-type')).describedAs("botón continuar paso 2"),
    passwordField: () =>
        PageElement.located(By.css('[data-testid="register-step-3"] input[type="password"]')).describedAs("campo contraseña"),
    submitButton: () =>
        PageElement.located(By.css('[data-testid="register-step-3"] button[type="submit"]')).describedAs("botón finalizar registro"),
};

export const Register = {
    withDetails: (nombre: string, email: string, password: string) =>
        Task.where(
            `#actor se registra con ${nombre}`,
            Navigate.to("/register"),
            Wait.until(RegisterPage.nameField(), isVisible()),
            Enter.theValue(nombre).into(RegisterPage.nameField()),
            Click.on(RegisterPage.step1ContinueButton()),
            Wait.until(RegisterPage.emailField(), isVisible()),
            Enter.theValue(email).into(RegisterPage.emailField()),
            Click.on(RegisterPage.step2ContinueButton()),
            Wait.until(RegisterPage.passwordField(), isVisible()),
            Enter.theValue(password).into(RegisterPage.passwordField()),
            Click.on(RegisterPage.submitButton()),
            Wait.until(LoginPage.sidebarElement(), isVisible()),
        ),
};
