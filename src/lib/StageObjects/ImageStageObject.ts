import { StageObject } from "./StageObject";


export class ImageStageObject extends StageObject {
  public displayObject: PIXI.Sprite;

  // eslint-disable-next-line no-unused-private-class-members
  #sizeChange$ = this.size$.pipe(
    rxjs.takeUntil(this.destroy$)
  ).subscribe(size => {
    if (this.displayObject) {
      this.displayObject.width = size.width;
      this.displayObject.height = size.height;
    }
  })

  constructor(public readonly source: PIXI.SpriteSource) {
    super();
    this.displayObject = PIXI.Sprite.from(source);
    this.displayObject.visible = false;
  }
}
