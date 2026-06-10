import { BeforeAll, AfterAll, Before, After, setDefaultTimeout } from "@cucumber/cucumber";
import { engage } from "@serenity-js/core";
import { chromium, type Browser } from "playwright";
import { Actors } from "../screenplay/actors/actors";

setDefaultTimeout(60_000);

let browser: Browser;

BeforeAll(async () => {
    browser = await chromium.launch({ headless: false, slowMo: 300 });
});

AfterAll(async () => {
    await browser?.close();
});

Before(async () => {
    engage(new Actors(browser));
});