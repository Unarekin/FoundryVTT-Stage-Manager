import { CustomHooks } from './constants';
import { log } from "../logging";
import { InvalidContainerError } from './errors';
import { StageManagerBackgroundGroup, StageManagerCanvasGroup, StageManagerForegroundGroup, StageManagerPrimaryGroup, StageManagerTextBoxGroup } from "./CanvasGroups";
import { } from "./errors";
import { ImageStageObject, StageObject, TextStageObject } from "./StageObjects";

/**
 * 
 */
export default class StageManager {


  public canvasGroup?: StageManagerCanvasGroup;
  public foreground?: StageManagerForegroundGroup;
  public primary?: StageManagerPrimaryGroup;
  public background?: StageManagerBackgroundGroup;
  public textBoxes?: StageManagerTextBoxGroup;

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
    if (!container) throw new InvalidContainerError();
    const stageObject = new ImageStageObject(image);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

  public addText(text: string, style?: PIXI.ITextStyle, container: PIXI.Container | undefined = this.primary): TextStageObject {
    if (!container) throw new InvalidContainerError();
    const stageObject = new TextStageObject(text, style);
    this.addStageObject(stageObject, container);
    return stageObject;
  }

}

class SystemControlsLayer extends InteractionLayer { }