import { Enter } from "@serenity-js/web";
import { By, PageElement } from "@serenity-js/web";

export const FillField = {
    with: (selector: string, value: string) =>
        Enter.theValue(value).into(
            PageElement.located(By.css(selector)).describedAs(selector)
        ),
};