import { Given, When, Then } from "@cucumber/cucumber";
import { actorInTheSpotlight } from "@serenity-js/core";
import { Ensure, isGreaterThan, includes } from "@serenity-js/assertions";
import { Click, Text } from "@serenity-js/web";
import { NavigateToEvaluation, EvaluationPage } from "../../screenplay/tasks/Evaluation";

When("Stephano navega a la evaluación {int} del proyecto {int}", async (evaluationId: number, projectId: number) => {
    await actorInTheSpotlight().attemptsTo(
        NavigateToEvaluation.withIds(1, projectId, evaluationId)
    );
});

Then("Stephano debería ver el formulario de evaluación", async () => {
    await actorInTheSpotlight().attemptsTo(
        NavigateToEvaluation.waitForElement(EvaluationPage.form())
    );
});

Then("Stephano debería ver la barra de progreso", async () => {
    await actorInTheSpotlight().attemptsTo(
        NavigateToEvaluation.waitForElement(EvaluationPage.progressBar())
    );
});

Then("Stephano debería ver al menos una dimensión", async () => {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(
            EvaluationPage.dimensionTitles().count(),
            isGreaterThan(0)
        )
    );
});

Then("Stephano debería ver el contador de progreso", async () => {
    await actorInTheSpotlight().attemptsTo(
        NavigateToEvaluation.waitForElement(EvaluationPage.progressCount())
    );
});

Then("el progreso debería mostrar 0 preguntas respondidas", async () => {
    await actorInTheSpotlight().attemptsTo(
        Ensure.that(
            Text.of(EvaluationPage.progressCount()),
            includes("0 /")
        )
    );
});

Then("Stephano debería ver el progreso actualizado", async () => {
    await actorInTheSpotlight().attemptsTo(
        NavigateToEvaluation.waitForElement(EvaluationPage.progressCount())
    );
});

When("Stephano responde la primera pregunta disponible", async () => {
    await actorInTheSpotlight().attemptsTo(
        Click.on(EvaluationPage.firstLikertOption())
    );
});