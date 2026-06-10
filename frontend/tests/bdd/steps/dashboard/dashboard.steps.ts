import { Given, When, Then } from "@cucumber/cucumber";
import { actorInTheSpotlight } from "@serenity-js/core";
import { Login } from "../../screenplay/tasks/Login";
import { NavigateTo, Dashboard } from "../../screenplay/tasks/NavigateTo";

const VALID_EMAIL = "stephano.mejia@outlook.es";
const VALID_PASSWORD = "Stephano123456789";

Given("Stephano ha iniciado sesión correctamente", async () => {
    await actorInTheSpotlight().attemptsTo(
        Login.withCredentials(VALID_EMAIL, VALID_PASSWORD)
    );
});

When("Stephano navega al dashboard", async () => {
    await actorInTheSpotlight().attemptsTo(
        NavigateTo.dashboard()
    );
});

Then("Stephano debería ver la lista de proyectos recientes", async () => {
    await actorInTheSpotlight().attemptsTo(
        Login.waitForElement(Dashboard.projectList())
    );
});