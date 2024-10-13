import { CustomHooks } from './constants';
import { log } from "../logging";

import { StageManagerBackgroundGroup, StageManagerCanvasGroup, StageManagerForegroundGroup, StageManagerPrimaryGroup, StageManagerTextBoxGroup } from "./CanvasGroups";
import { InvalidContainerError } from "../errors";
import { ImageStageObject, MotherBGStageObject, StageObject, TextStageObject, ActorStageObject, CanvasStageObject, TokenStageObject } from "./StageObjects";

/**
 * 
 */
export default class StageManager {


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

  public readonly stageObjects: StageObject[] = [];

  /**
   * Creates our child canvas groups and attaches everything to the PIXI stage
   */
  public intializeCanvas() {
    this.canvasGroup = new StageManagerCanvasGroup();
    this.foreground = new StageManagerForegroundGroup();
    this.primary = new StageManagerPrimaryGroup();
    this.background = new StageManagerBackgroundGroup();
    this.textBoxes = new StageManagerTextBoxGroup();

    if (canvas) {
      if (canvas.stage) canvas.stage.addChild(this.canvasGroup);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (canvas as any).stageManager = this.canvasGroup;
    }

    this.canvasGroup.addChild(this.background, this.primary, this.foreground);

    log("Adding PIXI layer");
    canvas?.stage?.addChild(this.canvasGroup);

    CONFIG.Canvas.layers[__MODULE_ID__] = {
      layerClass: SystemControlsLayer,
      group: "interface"
    };
  }


  public registerSceneControlButtons(controls: SceneControl[]) {
    log("Registering scene controls");
    const tools: SceneControlTool[] = [
      {
        name: "add-from-actor",
        title: "STAGEMANAGER.SCENECONTROLS.ACTOR",
        icon: "fas fa-person"
      },
      {
        name: "add-from-token",
        title: "STAGEMANAGER.SCENECONTROLS.TOKEN",
        icon: "sm-icon sm-token"
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
    this.stageObjects.push(object);
    container.addChild(object.displayObject);

    const destroySub = object.destroy$.subscribe(() => {
      destroySub.unsubscribe();
      this.removeStageObject(object);
    });
  }

  public removeStageObject(object: StageObject) {
    if (this.stageObjects.includes(object)) {
      this.stageObjects.splice(this.stageObjects.indexOf(object), 1);
      if (!object.destroyed) object.destroy();
    }
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

}

class SystemControlsLayer extends InteractionLayer { }