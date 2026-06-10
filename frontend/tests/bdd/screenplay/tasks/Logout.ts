import { Task, Wait } from "@serenity-js/core";
import { isVisible, By, Click, PageElement } from "@serenity-js/web";
import { LoginPage } from "./Login";

export const LogoutPage = {
    userMenuToggle: () =>
        PageElement.located(By.css('[data-testid="sidebar-user-toggle"]')).describedAs("menú de usuario"),
    logoutButton: () =>
        PageElement.located(By.css('[data-testid="sidebar-logout-button"]')).describedAs("botón cerrar sesión"),
    loginEmailField: () =>
        LoginPage.emailField(),
};

export const Logout = {
    fromSidebar: () =>
        Task.where(
            `#actor cierra sesión`,
            Wait.until(LogoutPage.userMenuToggle(), isVisible()),
            Click.on(LogoutPage.userMenuToggle()),
            Wait.until(LogoutPage.logoutButton(), isVisible()),
            Click.on(LogoutPage.logoutButton()),
            Wait.until(LogoutPage.loginEmailField(), isVisible()),
        ),
};
