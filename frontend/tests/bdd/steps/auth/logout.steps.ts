import { When, Then } from "@cucumber/cucumber";
import { actorInTheSpotlight } from "@serenity-js/core";
import { Ensure, includes } from "@serenity-js/assertions";
import { Logout } from "../../screenplay/tasks/Logout";
import { Login, LoginPage } from "../../screenplay/tasks/Login";
import { CurrentUrl } from "../../screenplay/questions/CurrentUrl";

When("Stephano cierra su sesión", async () => {
    await actorInTheSpotlight().attemptsTo(
        Logout.fromSidebar()
    );
});

Then("Stephano debería ser redirigido a la página de login", async () => {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(CurrentUrl, includes("/login"))
    );
});

Then("Stephano debería ver el formulario de acceso", async () => {
    await actorInTheSpotlight().attemptsTo(
        Login.waitForElement(LoginPage.emailField())
    );
});
