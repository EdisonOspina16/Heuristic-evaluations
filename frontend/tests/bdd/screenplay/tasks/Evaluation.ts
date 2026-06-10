import { Task, Wait, Duration, Answerable } from "@serenity-js/core";
import { By, Click, Navigate, PageElement, PageElements, isVisible } from "@serenity-js/web";
import { isPresent } from "@serenity-js/assertions";

export const EvaluationPage = {
    form: () =>
        PageElement.located(By.css('form')).describedAs("formulario de evaluación"),

    progressBar: () =>
        PageElement.located(By.css('[data-cy="progress-bar"]')).describedAs("barra de progreso"),

    progressCount: () =>
        PageElement.located(By.css('[data-cy="progress-count"]')).describedAs("contador de progreso"),

    dimensionTitles: () =>
        PageElements.located(By.css('[data-cy="dimension-title"]')).describedAs("títulos de dimensión"),

    firstLikertOption: () =>
        PageElements.located(By.css('.flex.flex-col.items-center.gap-2.cursor-pointer'))
            .describedAs("opciones likert")
            .first(),

    submitButton: () =>
        PageElement.located(By.css('button[type="submit"]')).describedAs("botón finalizar evaluación"),
};

export const NavigateToEvaluation = {
    withIds: (plantillaId: number, projectId: number, evaluationId: number) =>
        Task.where(
            `#actor navega a la evaluación ${evaluationId} del proyecto ${projectId}`,
            Navigate.to(`/evaluacion/${plantillaId}?project_id=${projectId}&evaluation_id=${evaluationId}`),
            Wait.upTo(Duration.ofSeconds(30)).until(
                PageElement.located(By.css('[data-cy="progress-bar"]')).describedAs("carga completa"),
                isPresent()
            ),
        ),

    waitForElement: (element: Answerable<PageElement>) =>
        Task.where(
            `#actor espera que el elemento sea visible`,
            Wait.upTo(Duration.ofSeconds(15)).until(element, isPresent()),
        ),
};