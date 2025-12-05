import { log } from "./logging";
import { SocketManager } from "./SocketManager";

export class StageManager {
  public readonly version = __MODULE_VERSION__;
  public readonly sockets = new SocketManager();

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