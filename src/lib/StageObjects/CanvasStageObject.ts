import { ImageStageObject } from "./ImageStageObject";

export class CanvasStageObject extends ImageStageObject {

  #canvas: HTMLCanvasElement;

  protected override preRender(): void {
    this.displayObject.texture.baseTexture.update();
  }

  protected onDestroy(): void {
    this.#canvas.remove();
  }

  constructor(canvas: HTMLCanvasElement) {
    const texture = PIXI.Texture.from(canvas);
    super(texture);
    this.#canvas = canvas;
  }
}