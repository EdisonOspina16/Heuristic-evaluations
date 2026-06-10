import { Task, Wait, Duration } from "@serenity-js/core";
import { Navigate, isVisible } from "@serenity-js/web";
import { By, PageElement } from "@serenity-js/web";

export const Sidebar = {
    element: () =>
        PageElement.located(By.css('aside.bg-bg-sidebar')).describedAs("sidebar"),
};

export const Dashboard = {
    projectList: () =>
        PageElement.located(By.css('.space-y-1')).describedAs("lista de proyectos"),
};

export const NavigateTo = {
    dashboard: () =>
        Task.where(
            `#actor navega al dashboard`,
            Navigate.to("/dashboard"),
            Wait.until(Sidebar.element(), isVisible()),
        ),
};