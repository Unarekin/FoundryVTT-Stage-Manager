import { InvalidUserError } from "./errors";
import { localize, inputPrompt } from "./functions";
import { InputManager } from "./InputManager";
import { log, logError } from "./logging";
import { StageManager } from "./StageManager";
import { DialogueStageObject, ImageStageObject, TextStageObject } from "./stageobjects";
import { PartialWithRequired, SerializedImageStageObject, SerializedTextStageObject, TOOL_LAYERS } from "./types";
// import { StageManager } from "./StageManager";

let controlsInitialized = false;


export class StageManagerControlsLayer extends InteractionLayer {
  public controlAll() {
    StageManager.StageObjects.forEach(obj => {
      if (StageManager.canModifyStageObject(game?.user?.id ?? "", obj.id) && obj.selectTool === game.activeTool)
        obj.selected = true;
    });
  }

  _sendToBackOrBringToFront(front: boolean): boolean {
    StageManager.StageObjects.selected.sort((a, b) => a.zIndex - b.zIndex).forEach(obj => {
      if (!obj.canUserModify(game.user as User, "modify")) return;
      if (front)
        obj.bringToFront();
      else
        obj.sendToBack();
    });
    return true;
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
        name: "add-from-image",
        title: "STAGEMANAGER.SCENECONTROLS.IMAGE",
        icon: "fas fa-image",
        onClick: () => {
          StageManager.DeselectAll();
          void addImage();
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
        name: "add-dialogue",
        title: "STAGEMANAGER.SCENECONTROLS.DIALOGUE",
        icon: `fas fa-comments`,
        button: true,
        visible: StageManager.canAddStageObjects(game?.user?.id ?? ""),
        onClick: () => {
          StageManager.DeselectAll();
          void addDialogue();
        }
      },
      {
        name: "view-as",
        title: "STAGEMANAGER.SCENECONTROLS.VIEWAS",
        icon: `fas ${StageManager.ViewingAs !== game.user ? "fa-eye-slash" : "fa-eye"}`,
        visible: StageManager.canAddStageObjects(game?.user?.id ?? "") && game?.users?.some((user: User) => user !== game.user && user.canUserModify(game.user as User, "update")),
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

async function addDialogue() {
  const layer = TOOL_LAYERS[game?.activeTool ?? ""];
  if (!layer) return;

  const dialogue = new DialogueStageObject();

  if (!dialogue.panel.displayObject.texture.valid) {
    await new Promise<void>(resolve => {
      dialogue.panel.displayObject.texture.baseTexture.once("loaded", () => { resolve(); });
    });
  }

  const obj = await StageManager.CreateStageObject<DialogueStageObject>({
    ...dialogue.serialize()
  });
  dialogue.destroy();

  if (obj) StageManager.addStageObject(obj, layer);
}

async function addText() {
  try {
    const layer = TOOL_LAYERS[game?.activeTool ?? ""];
    if (!layer) return;

    const inputText = await inputPrompt(
      await renderTemplate(`modules/${__MODULE_ID__}/templates/textInput.hbs`, {}),
      "STAGEMANAGER.ADDTEXT.TITLE"
    );

    if (!inputText) return;

    const textObj = new PIXI.HTMLText(inputText);
    textObj.anchor.x = textObj.anchor.y = 0.5;

    const displayObject = await InputManager.PlaceDisplayObject(textObj, layer) as PIXI.HTMLText;
    if (!(displayObject instanceof PIXI.HTMLText)) return;

    const text: PartialWithRequired<SerializedTextStageObject, "type"> = {
      type: "text",
      id: foundry.utils.randomID(),
      text: inputText,
      bounds: {
        x: displayObject.x / window.innerWidth,
        y: displayObject.y / window.innerHeight,
        width: displayObject.width / window.innerWidth,
        height: displayObject.height / window.innerHeight
      },
      layer,
      ...((StageManager.ViewingAs instanceof User && StageManager.ViewingAs !== game.user) ? { scope: "user", scopeOwners: [StageManager.ViewingAs.uuid] } : {})
    }

    displayObject.destroy();

    const obj = await StageManager.CreateStageObject(text, true);
    if (obj instanceof TextStageObject) StageManager.addStageObject(obj);

  } catch (err) {
    logError(err as Error);
  }
}

async function addImage() {
  try {
    const layer = TOOL_LAYERS[game?.activeTool ?? ""];
    if (!layer) return;

    const result = await new Promise<string | undefined>(resolve => {
      new FilePicker({
        type: "imagevideo",
        displayMode: "tiles",
        callback: result => { resolve(result); }
      }).render(true);
    });

    if (!result) return;

    const sprite = PIXI.Sprite.from(result);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;

    const displayObject = await InputManager.PlaceDisplayObject(sprite, layer) as PIXI.Sprite;

    // Ensure texture is loaded.
    if (!displayObject.texture.valid)
      await new Promise<void>(resolve => { displayObject.texture.baseTexture.once("loaded", () => { resolve(); }) })


    const img: PartialWithRequired<SerializedImageStageObject, "type"> = {
      type: "image",
      id: foundry.utils.randomID(),
      version: __MODULE_VERSION__,
      src: result,
      bounds: {
        x: displayObject.x / window.innerWidth,
        y: displayObject.y / window.innerHeight,
        width: displayObject.width / window.innerWidth,
        height: displayObject.height / window.innerHeight
      },
      layer,
      ...((StageManager.ViewingAs instanceof User && StageManager.ViewingAs !== game.user) ? { scope: "user", scopeOwners: [StageManager.ViewingAs.uuid] } : {})
    }

    displayObject.destroy();

    const obj = await StageManager.CreateStageObject(img, true);
    if (obj instanceof ImageStageObject) StageManager.addStageObject(obj);
  } catch (err) {
    logError(err as Error);
  }
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
          rejectOnClose: false,
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