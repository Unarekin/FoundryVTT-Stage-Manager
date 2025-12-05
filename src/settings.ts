import { log } from "logging";

Hooks.once("init", () => {
  // Register our settings

  if (!game?.settings) return;
  game.settings.register(__MODULE_ID__, "globalStageObjects", {
    name: "StageObjects",
    hint: "",
    config: false,
    scope: "world",
    requiresReload: false,
    type: Object,
    default: {}
  })

  log("Settings initialized");
})