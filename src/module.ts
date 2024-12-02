/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StageManager } from "./StageManager"
import { log } from "./logging";

(window as any).StageManager = StageManager;

Hooks.on("canvasReady", () => {
  (window as any).__PIXI_DEVTOOLS__ = {
    stage: canvas?.stage,
    renderer: canvas?.app?.renderer
  };

  StageManager.init();
  if (game) (game as any).StageManager = StageManager;

  log("Initialized.");
})