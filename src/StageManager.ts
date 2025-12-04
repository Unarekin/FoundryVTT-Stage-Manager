import { log } from "./logging";

export class StageManager {
  public readonly version = __MODULE_VERSION__;


  private canvasReady() { /** Empty */ }

  public constructor() {

    this.canvasReady();
    Hooks.on("canvasReady", () => { this.canvasReady(); });


    log("Initialized");
  }
}

Hooks.once("canvasReady", () => {
  if (game)
    game.StageManager = new StageManager();
})