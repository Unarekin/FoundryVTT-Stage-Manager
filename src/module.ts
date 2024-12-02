import { StageManager } from "./StageManager"

Hooks.on("canvasReady", () => {
  StageManager.init();
})