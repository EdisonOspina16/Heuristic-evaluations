import { Given, When, Then } from "@cucumber/cucumber";
import { actorCalled, actorInTheSpotlight } from "@serenity-js/core";
import { Ensure, includes } from "@serenity-js/assertions";
import { Login, LoginPage } from "../../screenplay/tasks/Login";
import { CurrentUrl } from "../../screenplay/questions/CurrentUrl";
import { Sidebar } from "../../screenplay/tasks/NavigateTo";

const VALID_PASSWORD = "Stephano123456789";

Given("que el actor {string} está listo para interactuar", (actorName: string) => {
    actorCalled(actorName);
});

When(
    "Stephano intenta iniciar sesión con email {string} y contraseña válida",
    async (email: string) => {
        await actorInTheSpotlight().attemptsTo(
            Login.withCredentials(email, VALID_PASSWORD)
        );
    }
);

When(
    "Stephano intenta iniciar sesión con email {string} y contraseña {string}",
    async (email: string, password: string) => {
        await actorInTheSpotlight().attemptsTo(
            Login.withCredentials(email, password)
        );
    }
);

Then("Stephano debería ser redirigido al dashboard", async () => {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(CurrentUrl, includes("/dashboard"))
    );
});

Then("Stephano debería ver el sidebar de navegación", async () => {
    await actorInTheSpotlight().attemptsTo(
        Login.waitForElement(LoginPage.sidebarElement())
    );
});

Then("Stephano debería ver un mensaje de error", async () => {
    await actorInTheSpotlight().attemptsTo(
        Login.waitForElement(LoginPage.errorMessage())
    );
});

Then("Stephano debería permanecer en la página de login", async () => {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(CurrentUrl, includes("/login"))
    );
});