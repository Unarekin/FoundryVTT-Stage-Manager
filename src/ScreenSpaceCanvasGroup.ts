import { StageLayer } from "./types";

export class ScreenSpaceCanvasGroup extends PIXI.Container {


  protected setInverseMatrix() {
    if (canvas?.app?.stage)
      this.transform.setFromMatrix(canvas.app.stage.localTransform.clone().invert());
  }

  constructor(public name = "ScreenSpaceCanvasGroup", public readonly layer: StageLayer) {
    super();
    this.interactiveChildren = true;
    this.interactive = true;
    this.eventMode = "static";

    if (canvas?.app) {
      canvas.app.renderer.addListener("prerender", () => {
        this.setInverseMatrix();
      })
    }
  }
}