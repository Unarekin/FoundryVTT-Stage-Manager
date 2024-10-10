import { StageManagerCanvasGroup } from "./StageManagerCanvasGroup"
import { StageManagerForegroundGroup } from './StageManagerForegroundGroup';
import { StageManagerBackgroundGroup } from './StageManagerBackgroundGroup';
import { StageManagerPrimaryGroup } from './StageManagerPrimaryGroup';

/**
 * 
 */
export default class StageManager {

  public canvasGroup = new StageManagerCanvasGroup();

  public foreground = new StageManagerForegroundGroup();
  public primary = new StageManagerPrimaryGroup();
  public background = new StageManagerBackgroundGroup();


  constructor() {
    if (canvas) {
      if (canvas.stage) canvas.stage.addChild(this.canvasGroup);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (canvas as any).stageManager = this.canvasGroup;
    }

    this.canvasGroup.addChild(this.background, this.primary, this.foreground);
  }
}