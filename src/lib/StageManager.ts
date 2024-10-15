import { CustomHooks } from './constants';
import { log } from "../logging";

import { StageManagerBackgroundGroup, StageManagerCanvasGroup, StageManagerForegroundGroup, StageManagerPrimaryGroup, StageManagerTextBoxGroup } from "./CanvasGroups";
import { InvalidContainerError } from "../errors";
import { ImageStageObject, MotherBGStageObject, StageObject, TextStageObject, ActorStageObject, CanvasStageObject, TokenStageObject } from "./StageObjects";
import { AddImageDialog } from './Applications/AddImageDialog';
import { StageObjects } from "./StageObjectsCollection"
/**
 * 
 */
export default class StageManager {

  public get USE_APPV2(): boolean { return !!game.release?.isNewer("12"); }
  // public readonly USE_APPV2 = false;

  public canvasGroup?: StageManagerCanvasGroup;
  public foreground?: StageManagerForegroundGroup;
  public primary?: StageManagerPrimaryGroup;
  public background?: StageManagerBackgroundGroup;
  public textBoxes?: StageManagerTextBoxGroup;

  // Object classes
  public StageObject = StageObject;
  public ImageStageObject = ImageStageObject;
  public TextStageObject = TextStageObject;
  public CanvasStageObject = CanvasStageObject;
  public MotherBGStageObject = MotherBGStageObject;
  public ActorStageObject = ActorStageObject;
  public TokenStageObject = TokenStageObject;

  public AddImageDialog = AddImageDialog;
  // public AddImageDialog = game.release?.isNewer(12) ? AddImageDialog : null;

  // public readonly stageObjects: StageObject[] = [];
  public readonly stageObjects = new StageObjects();

  /**
   * Creates our child canvas groups and attaches everything to the PIXI stage
   */
  public initializeCanvas() {
    this.canvasGroup = new StageManagerCanvasGroup();
    this.foreground = new StageManagerForegroundGroup();
    this.primary = new StageManagerPrimaryGroup();
    this.background = new StageManagerBackgroundGroup();
    this.textBoxes = new StageManagerTextBoxGroup();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (game as any).stageObjects = this.stageObjects;

    if (canvas) {
      if (canvas.stage) canvas.stage.addChild(this.canvasGroup);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (canvas as any).stageManager = this.canvasGroup;
    }

    this.canvasGroup.addChild(this.background, this.primary, this.foreground);

    log("Adding PIXI layer");
    canvas?.stage?.addChild(this.canvasGroup);
  }


  #controlsInitialized = false;
  public registerSceneControlButtons(controls: SceneControl[]) {
    log("Registering scene controls");
    if (!this.#controlsInitialized) {
      CONFIG.Canvas.layers[__MODULE_ID__] = {
        layerClass: StageManagerControlsLayer,
        group: "interface"
      };
      this.#controlsInitialized = true;
    }
    const tools: SceneControlTool[] = [
      {
        name: "add-speech-dock",
        title: "STAGEMANAGER.SCENECONTROLS.SPEECH",
        icon: "fas fa-comment"
      },
      {
        name: "add-from-actor",
        title: "STAGEMANAGER.SCENECONTROLS.ACTOR",
        icon: "fas fa-person"
      },
      {
        name: "add-from-token",
        title: "STAGEMANAGER.SCENECONTROLS.TOKEN",
        icon: "sm-icon sm-token"
      },
      {
        name: "add-from-image",
        title: "STAGEMANAGER.SCENECONTROLS.IMAGE",
        icon: "fas fa-image",
        onClick: () => {
          ImageStageObject.fromDialog(this.USE_APPV2)
            .then(obj => {
              if (!obj) return;
              this.addStageObject(obj, this.primary);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              ui.notifications.info(game.i18n?.format("STAGEMANAGER.DIALOGS.ADDIMAGE.SUCCESS", { name: obj.name }));
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            }).catch(err => { ui.notifications?.error(err); });
        },
        button: true
      },
      {
        name: "add-foreground-image",
        title: "STAGEMANAGER.SCENECONTROLS.FOREGROUND",
        icon: "sm-icon sm-foreground"
      },
      {
        name: "add-background-image",
        title: "STAGEMANAGER.SCENECONTROLS.BACKGROUND",
        icon: "sm-icon sm-background"
      },
      {
        name: "manage-docks",
        title: "STAGEMANAGER.SCENECONTROLS.MANAGE",
        icon: "fas fa-gears"
      },
      {
        name: "clear-docks",
        title: "STAGEMANAGER.SCENECONTROLS.CLEAR",
        icon: "fas fa-trash"
      }
    ];
    Hooks.callAll(CustomHooks.systemControlTools, tools);

    controls.push({
      name: __MODULE_ID__,
      title: "STAGEMANAGER.SCENECONTROLS.TITLE",
      icon: "sm-icon sm-curtains",
      tools,
      layer: __MODULE_ID__,
      visible: true,
      activeTool: ""
    });


  }


  public addStageObject(object: StageObject, container: PIXI.Container) {
    this.stageObjects.set(object.id, object);
    // this.stageObjects.push(object);
    container.addChild(object.displayObject);

    const destroySub = object.destroy$.subscribe(() => {
      destroySub.unsubscribe();
      this.removeStageObject(object);
    });
  }

  public removeStageObject(object: StageObject) {
    if (this.stageObjects.has(object.id))
      this.stageObjects.delete(object.id);
    if (!object.destroyed) object.destroy();
  }

  public addImage(image: PIXI.ImageSource, container: PIXI.Container | undefined = this.primary): ImageStageObject {
    if (!container || !(container instanceof PIXI.Container)) throw new InvalidContainerError();
    const stageObject = new ImageStageObject(image);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

  public addText(text: string, style?: PIXI.HTMLTextStyle, container: PIXI.Container | undefined = this.primary): TextStageObject {
    if (!container || !(container instanceof PIXI.Container)) throw new InvalidContainerError();
    const stageObject = new TextStageObject(text, style);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

  public addCanvas(canvas: HTMLCanvasElement, container: PIXI.Container | undefined = this.primary) {
    if (!container || !(container instanceof PIXI.Container)) throw new InvalidContainerError();
    const stageObject = new CanvasStageObject(canvas);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

  public addMotherBackground(layer1 = 0, layer2 = 0, container: PIXI.Container | undefined = this.primary) {
    if (!container || !(container instanceof PIXI.Container)) throw new InvalidContainerError();
    const stageObject = new MotherBGStageObject(layer1, layer2);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

  public addActor(actor: Actor, container: PIXI.Container | undefined = this.primary): ActorStageObject {
    if (!container || !(container instanceof PIXI.Container)) throw new InvalidContainerError();
    const stageObject = new ActorStageObject(actor);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

  public addToken(token: Token, container: PIXI.Container | undefined = this.primary): TokenStageObject {
    if (!container || !(container instanceof PIXI.Container)) throw new InvalidContainerError();
    const stageObject = new TokenStageObject(token);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

  public addForegroundImage(image: PIXI.ImageSource): ImageStageObject {
    return this.addImage(image, this.foreground);
  }

  public addBackgroundImage(image: PIXI.ImageSource): ImageStageObject {
    return this.addImage(image, this.background);
  }


  //#region Dialogs
  // public addImageDialog() {
  //   return new AddImageDialog().render();
  // }
  //#endregion
}

class StageManagerControlsLayer extends InteractionLayer { }