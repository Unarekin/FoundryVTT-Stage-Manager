

Hooks.on("getSceneControlButtons", (controls: Record<string, foundry.applications.ui.SceneControls.Control>) => {

  const tools: Record<string, foundry.applications.ui.SceneControls.Tool> = {};

  // Give other objects a chance to add tools to our list of scene controls,
  // for modularity.  Particularly useful for externally-registered StageObjects
  Hooks.callAll(`${__MODULE_ID__}.getSceneControls`, tools);

  controls["stage-manager"] = {
    name: "stage-manager",
    title: "STAGEMANAGER.MODULENAME",
    icon: "",
    tools,
    order: 100,
    visible: game?.user?.isGM,
    activeTool: ""
  }
});
