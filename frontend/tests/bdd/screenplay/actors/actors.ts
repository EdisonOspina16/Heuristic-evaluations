import { Actor, Cast, TakeNotes } from "@serenity-js/core";
import { BrowseTheWebWithPlaywright } from "@serenity-js/playwright";
import { Browser } from "playwright";

export class Actors implements Cast {
    constructor(private readonly browser: Browser) { }

    prepare(actor: Actor): Actor {
        return actor.whoCan(
            BrowseTheWebWithPlaywright.using(this.browser, {
                baseURL: process.env.BASE_URL ?? "http://localhost:3000",
            }),
            TakeNotes.usingAnEmptyNotepad()
        );
    }
}