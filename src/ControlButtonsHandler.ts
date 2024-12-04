import { log } from "./logging";
import { StageManager } from "./StageManager";
// import { StageManager } from "./StageManager";

let controlsInitialized = false;

export class StageManagerControlsLayer extends InteractionLayer { }

export class ControlButtonsHandler {
  public static register(controls: SceneControl[]) {
    if (!controlsInitialized) {
      CONFIG.Canvas.layers[__MODULE_ID__] = {
        layerClass: StageManagerControlsLayer,
        group: "interface"
      }
      controlsInitialized = true;
      log("Registered scene controls.")
    }

    const tools: SceneControlTool[] = [
      {
        name: "sm-select-foreground",
        title: "STAGEMANAGER.SCENECONTROLS.SELECTFOREGROUND",
        icon: "sm-icon control select-foreground",
        visible: StageManager.canAddStageObjects(game?.user as User)
      },
      {
        name: "sm-select-primary",
        title: "STAGEMANAGER.SCENECONTROLS.SELECTPRIMARY",
        icon: "sm-icon control select-primary",
        visible: StageManager.canAddStageObjects(game?.user as User)
      },
      {
        name: "sm-select-background",
        title: "STAGEMANAGER.SCENECONTROLS.SELECTBACKGROUND",
        icon: "sm-icon control select-background",
        visible: StageManager.canAddStageObjects(game?.user as User)
      },
      {
        name: "sm-select-text",
        title: "STAGEMANAGER.SCENECONTROLS.SELECTTEXT",
        icon: "sm-icon control select-text",
        visible: StageManager.canAddStageObjects(game?.user as User)
      },
      {
        name: "add-from-image",
        title: "STAGEMANAGER.SCENECONTROLS.IMAGE",
        icon: "fas fa-image",
        onClick: () => { addImage(); },
        visible: StageManager.canAddStageObjects(game?.user as User),
        button: true
      }
    ]

    controls.push({
      name: __MODULE_ID__,
      title: "STAGEMANAGER.SCENECONTROLS.TITLE",
      icon: "sm-icon curtains control",
      tools,
      layer: __MODULE_ID__,
      visible: tools.some(item => item.visible),
      activeTool: "sm-select-primary"
    });

  }

}


function addImage() {
  new FilePicker({
    type: "imagevideo",
    displayMode: "tiles",
    callback: result => {
      if (result) {
        const img = StageManager.addImage(result, window.innerWidth / 2, window.innerHeight / 2);
        img.placing = true;
      }
    },
  }).render(true);
}
