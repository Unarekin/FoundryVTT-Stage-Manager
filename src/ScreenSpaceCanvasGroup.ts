import { StageLayer } from "./types";

export class ScreenSpaceCanvasGroup extends PIXI.Container {
  public get selectTool() {
    switch (this.layer) {
      case "background": return "sm-select-background";
      case "foreground": return "sm-select-foreground";
      case "primary": return "sm-select-primary"
    }
  }

  protected setInverseMatrix() {
    if (canvas?.app?.stage)
      this.transform.setFromMatrix(canvas.app.stage.localTransform.clone().invert());
  }

  override sortableChildren = true;

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