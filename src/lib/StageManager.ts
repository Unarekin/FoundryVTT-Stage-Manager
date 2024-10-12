import { StageManagerCanvasGroup } from "./CanvasGroups/StageManagerCanvasGroup"
import { StageManagerForegroundGroup } from './CanvasGroups/StageManagerForegroundGroup';
import { StageManagerBackgroundGroup } from './CanvasGroups/StageManagerBackgroundGroup';
import { StageManagerPrimaryGroup } from './CanvasGroups/StageManagerPrimaryGroup';
import { StageManagerTextBoxGroup } from './CanvasGroups/StageManagerTextBoxGroup';
import { CustomHooks } from './constants';
import { log } from "../logging";
import { StageObject } from './StageObjects/StageObject';


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

  public addStageObject(object: StageObject) { }
}

class SystemControlsLayer extends InteractionLayer { }