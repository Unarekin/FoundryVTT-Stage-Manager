import { HOOKS } from "./hooks";

Hooks.on("getSceneControlButtons", (controls: Record<string, foundry.applications.ui.SceneControls.Control>) => {
  const tools: Record<string, foundry.applications.ui.SceneControls.Tool> = {
    "fg-layer": {
      name: "fg-layer",
      title: "STAGEMANAGER.CONTROLS.FOREGROUND",
      icon: "fa-solid sm-icon foreground",
      order: 0,
      visible: game?.user?.isGM,
    },
    "bg-layer": {
      name: "bg-layer",
      title: "STAGEMANAGER.CONTROLS.BACKGROUND",
      icon: "fa-solid sm-icon background",
      order: 10,
      visible: game?.user?.isGM
    }
  };

  // Give other objects a chance to add tools to our list of scene controls,
  // for modularity.  Particularly useful for externally-registered StageObjects
  Hooks.callAll(HOOKS.SCENE_CONTROLS, tools);

  controls["stage-manager"] = {
    name: "stage-manager",
    title: "STAGEMANAGER.MODULENAME",
    icon: "fa-solid sm-icon curtains",
    tools,
    order: 100,
    visible: game?.user?.isGM,
    activeTool: "fg-layer"
  }
});
