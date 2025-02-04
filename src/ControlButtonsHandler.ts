import { inputPrompt } from "./applications/functions";
import { InvalidUserError } from "./errors";
import { localize } from "./functions";
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
      },
      {
        name: "view-as",
        title: "STAGEMANAGER.SCENECONTROLS.VIEWAS",
        icon: `fas ${StageManager.ViewingAs !== game.user ? "fa-eye-slash" : "fa-eye"}`,
        visible: StageManager.canAddStageObjects(game?.user?.id ?? "") && game?.users?.some((user: User) => user !== game.user && user.canUserModify(game.user, "update")),
        onClick: () => {
          void viewAsUser();
        },
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
    logError(err as Error);
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

function setViewAsIcon() {
  const i = document.querySelector(`.control-tool[data-tool="view-as"] i`);
  if (i instanceof HTMLElement) {
    if (i.classList.contains("fa-eye")) {
      i.classList.remove("fa-eye");
      i.classList.add("fa-eye-slash");
    } else {
      i.classList.remove("fa-eye-slash");
      i.classList.add("fa-eye");
    }
  }
}

async function viewAsUser() {
  if (StageManager.ViewingAs !== game.user) {
    if (game.user instanceof User) StageManager.ViewStageAsUser(game.user);
    setViewAsIcon();
  } else {
    const selected = await new Promise<string | undefined>((resolve, reject) => {
      const context = {
        users: game?.users?.filter((user: User) => user !== game.user && game.user instanceof User ? user.canUserModify(game.user, "update") : false) ?? []
      }

      const actions = Object.fromEntries(context.users.map((user: User) => [user.id, () => { resolve(user.id ?? undefined); }])) as Record<string, any>;

      void renderTemplate(`modules/${__MODULE_ID__}/templates/viewAsUser.hbs`, context)
        .then(content => foundry.applications.api.DialogV2.wait({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          window: ({ title: "STAGEMANAGER.VIEWASUSER.TITLE" } as any),
          content,
          actions,
          buttons: [
            {
              label: localize("Cancel"),
              action: "cancel"
            }
          ]
        }))
        .then(selected => { if (selected) resolve(undefined); })
        .catch(reject);

    });

    if (selected) {
      const user = game?.users?.get(selected) as User | undefined;
      if (user instanceof User) StageManager.ViewStageAsUser(user);
      else throw new InvalidUserError(selected);
      setViewAsIcon();
    }
  }
}