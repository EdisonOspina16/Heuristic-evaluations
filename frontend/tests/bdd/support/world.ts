import { setWorldConstructor, World } from "@cucumber/cucumber";
import { Actor } from "@serenity-js/core";

export class SerenityWorld extends World {
    private _actor: Actor | null = null;

    get actor(): Actor {
        if (!this._actor) throw new Error("Actor no inicializado");
        return this._actor;
    }

    set actor(actor: Actor) {
        this._actor = actor;
    }
}

setWorldConstructor(SerenityWorld);