import { StageObject } from "./StageObject";


export class ImageStageObject extends StageObject {
  public displayObject: PIXI.Sprite;

  constructor(public readonly source: PIXI.SpriteSource) {
    super();
    this.displayObject = PIXI.Sprite.from(source);
  }
}
