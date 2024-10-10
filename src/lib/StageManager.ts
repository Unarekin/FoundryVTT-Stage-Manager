import { StageManagerCanvasGroup } from "./StageManagerCanvasGroup"
import { StageManagerForegroundGroup } from './StageManagerForegroundGroup';
import { StageManagerBackgroundGroup } from './StageManagerBackgroundGroup';
import { StageManagerPrimaryGroup } from './StageManagerPrimaryGroup';
import { StageManagerTextBoxGroup } from './StageManagerTextBoxGroup';
import { CustomHooks } from './constants';
import { log } from "../logging";


/**
 * 
 */
export default class StageManager {


  public canvasGroup?: StageManagerCanvasGroup;
  public foreground?: StageManagerForegroundGroup;
  public primary?: StageManagerPrimaryGroup;
  public background?: StageManagerBackgroundGroup;
  public textBoxes?: StageManagerTextBoxGroup;


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
}

class SystemControlsLayer extends InteractionLayer { }