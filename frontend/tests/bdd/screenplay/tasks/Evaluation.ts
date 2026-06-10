import { Task, Wait, Duration, Answerable } from "@serenity-js/core";
import { isPresent } from "@serenity-js/assertions";
import { By, Click, Enter, Navigate, PageElement, PageElements } from "@serenity-js/web";

export const EvaluationPage = {
    form: () =>
        PageElement.located(By.css("form")).describedAs("formulario de evaluacion"),

    progressBar: () =>
        PageElement.located(By.css('[data-cy="progress-bar"]')).describedAs("barra de progreso"),

    progressCount: () =>
        PageElement.located(By.css('[data-cy="progress-count"]')).describedAs("contador de progreso"),

    dimensionTitles: () =>
        PageElements.located(By.css('[data-cy="dimension-title"]')).describedAs("titulos de dimension"),

    firstLikertOption: () =>
        PageElements.located(By.css(".flex.flex-col.items-center.gap-2.cursor-pointer"))
            .describedAs("opciones likert")
            .first(),

    firstCategoricalOption: () =>
        PageElements.located(By.css('[class*="grid-cols-1"][class*="md:grid-cols-2"] > div'))
            .describedAs("opciones categoricas")
            .first(),

    firstCommentField: () =>
        PageElements.located(By.css("textarea"))
            .describedAs("campos de comentarios")
            .first(),

    responseInput: (questionId: number) =>
        PageElement.located(By.css(`[data-cy="respuesta-input-${questionId}"]`))
            .describedAs(`respuesta de la pregunta ${questionId}`),

    responseInputs: () =>
        PageElements.located(By.css('[data-cy^="respuesta-input-"]'))
            .describedAs("respuestas registradas"),

    saveStatus: () =>
        PageElement.located(By.css("form .flex.items-center.gap-2.text-xs.text-zinc-500"))
            .describedAs("estado de guardado"),

    manualSaveButton: () =>
        PageElement.located(By.css('button[type="button"]')).describedAs("boton guardar progreso"),

    submitButton: () =>
        PageElement.located(By.css('button[type="submit"]')).describedAs("boton finalizar evaluacion"),

    errorMessage: () =>
        PageElement.located(By.css('[data-cy="error-message"]')).describedAs("mensaje de error de evaluacion"),

    firstEvaluationStatus: () =>
        PageElement.located(By.css("tbody tr:first-child td:nth-child(3)")).describedAs("estado de la evaluacion"),

    firstEvaluationProgress: () =>
        PageElement.located(By.css("tbody tr:first-child td:nth-child(4) span")).describedAs("progreso de la evaluacion"),
};

export const NavigateToEvaluation = {
    withIds: (plantillaId: number, projectId: number, evaluationId: number) =>
        Task.where(
            `#actor navega a la evaluacion ${evaluationId} del proyecto ${projectId}`,
            Navigate.to(`/evaluacion/${plantillaId}?project_id=${projectId}&evaluation_id=${evaluationId}`),
            Wait.upTo(Duration.ofSeconds(30)).until(
                EvaluationPage.progressBar(),
                isPresent()
            ),
        ),

    withTemplateAndProject: (plantillaId: number, projectId: number) =>
        Task.where(
            `#actor navega a una evaluacion nueva del proyecto ${projectId}`,
            Navigate.to(`/evaluacion/${plantillaId}?project_id=${projectId}`),
            Wait.upTo(Duration.ofSeconds(30)).until(
                EvaluationPage.progressBar(),
                isPresent()
            ),
        ),

    missingTemplate: (plantillaId: number, projectId: number) =>
        Task.where(
            "#actor navega a una evaluacion inexistente",
            Navigate.to(`/evaluacion/${plantillaId}?project_id=${projectId}`),
            Wait.upTo(Duration.ofSeconds(30)).until(
                EvaluationPage.errorMessage(),
                isPresent()
            ),
        ),

    missingEvaluation: (plantillaId: number, projectId: number, evaluationId: number) =>
        Task.where(
            "#actor intenta recuperar una evaluacion inexistente",
            Navigate.to(`/evaluacion/${plantillaId}?project_id=${projectId}&evaluation_id=${evaluationId}`),
            Wait.upTo(Duration.ofSeconds(30)).until(
                EvaluationPage.errorMessage(),
                isPresent()
            ),
        ),

    projectEvaluations: (projectId: number) =>
        Task.where(
            `#actor navega al listado de evaluaciones del proyecto ${projectId}`,
            Navigate.to(`/project/${projectId}/evaluations`),
            Wait.for(Duration.ofSeconds(3)),
        ),

    waitForElement: (element: Answerable<PageElement>) =>
        Task.where(
            "#actor espera que el elemento sea visible",
            Wait.upTo(Duration.ofSeconds(15)).until(element, isPresent()),
        ),
};

export const Evaluation = {
    answerFirstLikertQuestion: () =>
        Task.where(
            "#actor responde la primera pregunta likert disponible",
            Click.on(EvaluationPage.firstLikertOption()),
            Wait.for(Duration.ofSeconds(1)),
        ),

    answerFirstCategoricalQuestion: () =>
        Task.where(
            "#actor responde la primera pregunta categorica disponible",
            Click.on(EvaluationPage.firstCategoricalOption()),
            Wait.for(Duration.ofSeconds(1)),
        ),

    commentOnFirstQuestion: (comment: string) =>
        Task.where(
            "#actor registra un comentario en la primera pregunta",
            Enter.theValue(comment).into(EvaluationPage.firstCommentField()),
            Wait.for(Duration.ofSeconds(1)),
        ),

    saveDraft: () =>
        Task.where(
            "#actor guarda el borrador de la evaluacion",
            Click.on(EvaluationPage.manualSaveButton()),
            Wait.for(Duration.ofSeconds(2)),
        ),

    submit: () =>
        Task.where(
            "#actor envia la evaluacion",
            Click.on(EvaluationPage.submitButton()),
            Wait.for(Duration.ofSeconds(3)),
        ),
};
