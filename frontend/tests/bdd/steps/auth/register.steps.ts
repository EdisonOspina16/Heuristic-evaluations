import { When, Then } from "@cucumber/cucumber";
import { actorInTheSpotlight } from "@serenity-js/core";
import { Ensure, includes } from "@serenity-js/assertions";
import { Register } from "../../screenplay/tasks/Register";
import { Login, LoginPage } from "../../screenplay/tasks/Login";
import { CurrentUrl } from "../../screenplay/questions/CurrentUrl";

const VALID_PASSWORD = "Stephano123456789";

When(
    "Stephano se registra con nombre {string} y contraseña válida",
    async (nombre: string) => {
        const email = `stephano.${Date.now()}@example.com`;

        await actorInTheSpotlight().attemptsTo(
            Register.withDetails(nombre, email, VALID_PASSWORD)
        );
    }
);

Then("Stephano debería ser redirigido al dashboard después del registro", async () => {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(CurrentUrl, includes("/dashboard"))
    );
});

Then("Stephano debería ver el sidebar después del registro", async () => {
    await actorInTheSpotlight().attemptsTo(
        Login.waitForElement(LoginPage.sidebarElement())
    );
});
