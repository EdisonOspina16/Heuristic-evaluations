import { Task, Wait, Duration, Answerable } from "@serenity-js/core";
import { isPresent } from "@serenity-js/assertions";
import { By, Click, Enter, Navigate, PageElement, isVisible } from "@serenity-js/web";

export const LoginPage = {
    emailField: () =>
        PageElement.located(By.css('input[type="email"]')).describedAs("campo email"),
    passwordField: () =>
        PageElement.located(By.css('input[type="password"]')).describedAs("campo contraseña"),
    submitButton: () =>
        PageElement.located(By.css('button[type="submit"]')).describedAs("botón de login"),
    errorMessage: () =>
        PageElement.located(By.css('[role="alert"]')).describedAs("mensaje de error"),
    sidebarElement: () =>
        PageElement.located(By.css('aside.bg-bg-sidebar')).describedAs("sidebar"),
};

export const Login = {
    withCredentials: (email: string, password: string) =>
        Task.where(
            `#actor inicia sesión con ${email}`,
            Navigate.to("/login"),
            Wait.until(LoginPage.emailField(), isVisible()),
            Enter.theValue(email).into(LoginPage.emailField()),
            Enter.theValue(password).into(LoginPage.passwordField()),
            Click.on(LoginPage.submitButton()),
            Wait.for(Duration.ofSeconds(3)),
        ),

    waitForElement: (element: Answerable<PageElement>) =>
        Task.where(
            `#actor espera que el elemento sea visible`,
            Wait.upTo(Duration.ofSeconds(10)).until(element, isPresent()),
        ),
};