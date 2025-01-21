import { inputPrompt } from "./applications/functions";
import { InputManager } from "./InputManager";
import { log, logError } from "./logging";
import { StageManager } from "./StageManager";
import { ImageStageObject, TextStageObject } from "./stageobjects";
import { TOOL_LAYERS } from "./types";
// import { StageManager } from "./StageManager";

let controlsInitialized = false;


export class StageManagerControlsLayer extends InteractionLayer {
  public controlAll() {
    StageManager.StageObjects.forEach(obj => {
      if (StageManager.canModifyStageObject(game?.user?.id ?? "", obj.id) && obj.selectTool === game.activeTool)
        obj.selected = true;
    });
  }
}


export const TOOLS = Object.keys(TOOL_LAYERS);

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
        visible: true,
        onClick: () => {
          StageManager.DeselectAll();
        }
      },
      {
        name: "sm-select-primary",
        title: "STAGEMANAGER.SCENECONTROLS.SELECTPRIMARY",
        icon: "sm-icon control select-primary",
        visible: true,
        onClick: () => {
          StageManager.DeselectAll();
        }
      },
      {
        name: "sm-select-background",
        title: "STAGEMANAGER.SCENECONTROLS.SELECTBACKGROUND",
        icon: "sm-icon control select-background",
        visible: true,
        onClick: () => {
          StageManager.DeselectAll();
        }
      },
      {
        name: "sm-select-text",
        title: "STAGEMANAGER.SCENECONTROLS.SELECTTEXT",
        icon: "sm-icon control select-text",
        visible: true,
        onClick: () => {
          StageManager.DeselectAll();
        }
      },
      {
        name: "add-from-image",
        title: "STAGEMANAGER.SCENECONTROLS.IMAGE",
        icon: "fas fa-image",
        onClick: () => {
          StageManager.DeselectAll();
          addImage();
        },
        visible: StageManager.canAddStageObjects(game?.user?.id ?? ""),
        button: true
      },
      {
        name: "add-text",
        title: "STAGEMANAGER.SCENECONTROLS.TEXT",
        icon: "fas fa-paragraph",
        onClick: () => {
          StageManager.DeselectAll();
          void addText();
        },
        visible: StageManager.canAddStageObjects(game?.user?.id ?? ""),
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

async function addText() {
  try {
    const layer = TOOL_LAYERS[game?.activeTool ?? ""];
    if (!layer) return;

    const text = await inputPrompt("STAGEMANAGER.ADDTEXT.CONTENT", "STAGEMANAGER.ADDTEXT.TITLE");
    if (!text) return;

    const tempObj = new PIXI.HTMLText(text);
    tempObj.anchor.x = .5;
    tempObj.anchor.y = .5;

    const obj = await InputManager.PlaceDisplayObject(tempObj, layer);

    const textObj = new TextStageObject(text);
    textObj.x = obj.x;
    textObj.y = obj.y;

    tempObj.destroy();

    const created = await StageManager.CreateStageObject<TextStageObject>({ ...textObj.serialize() });
    if (created) StageManager.addStageObject(created, layer);

  } catch (err) {
    logError(err);
  }
}

function addImage() {
  new FilePicker({
    type: "imagevideo",
    displayMode: "tiles",
    callback: result => {
      if (result) {


        const layer = TOOL_LAYERS[game?.activeTool ?? ""];
        if (!layer) return;

        const sprite = PIXI.Sprite.from(result);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;

        InputManager.PlaceDisplayObject(sprite, layer)
          .then(obj => {
            const image = new ImageStageObject(result);
            image.x = obj.x;
            image.y = obj.y;
            sprite.destroy();

            return StageManager.CreateStageObject<ImageStageObject>({
              ...image.serialize()
            })
          })
          .then(obj => {
            // this.stageObject.displayObject.removeFromParent();

            if (obj) {
              if (obj) StageManager.addStageObject(obj, layer);

              // const stageObject = StageManager.deserialize(obj.deserialize());
              // StageManager.addStageObject(stageObject);
            }
          })
          .catch((err: Error) => {
            logError(err);
          })

      }
    },
  }).render(true);
}
