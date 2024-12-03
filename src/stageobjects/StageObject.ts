import { ScreenSpaceCanvasGroup } from "../ScreenSpaceCanvasGroup";
import { StageManager } from "../StageManager";
import { StageLayer } from "../types";

export abstract class StageObject {
  // #region Properties (4)

  private _draggable = true;
  private _dragging = false;


  public readonly id = foundry.utils.randomID();

  // #endregion Properties (4)

  // #region Constructors (1)

  constructor(protected _displayObject: PIXI.DisplayObject, public name: string = this.id) {
    this.displayObject.name = name;
    this.displayObject.interactive = true;
    this.displayObject.eventMode = "dynamic";
    if (this.draggable) {
      this.displayObject.on("pointerdown", e => {
        if (game && game.activeTool === "select-stage-object") {
          this.dragging = true;
          e.preventDefault();
        }
      });
    }
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (23)

  /** Object's rotation, in degrees */
  public get angle() { return this.displayObject.angle; }

  public set angle(angle) { this.displayObject.angle = angle; }

  public get destroyed() { return this.displayObject.destroyed; }

  public get displayObject() { return this._displayObject; }

  public get draggable() { return this._draggable; }

  public set draggable(draggable) {
    this._draggable = draggable;
    if (this.dragging) this.dragging = false;
  }

  public get dragging() { return this._dragging; }

  public set dragging(dragging) {
    this._dragging = dragging;
  }

  public get layer() {
    if (this.displayObject.parent instanceof ScreenSpaceCanvasGroup) {
      return this.displayObject.parent.layer;
    } else {
      return "";
    }
  }

  public setLayer(layer: StageLayer) {
    if (this.layer !== layer) StageManager.setStageObjectLayer(this, layer);
  }

  public get pivot() { return this.displayObject.pivot; }

  public set pivot(pivot) { this.displayObject.pivot = pivot; }

  /** Object's rotation, in radians  */
  public get rotation() { return this.displayObject.rotation; }

  public set rotation(rotation) { this.displayObject.rotation = rotation; }

  public get scale() { return this.displayObject.scale; }

  public set scale(scale) { this.displayObject.scale = scale; }

  public get skew() { return this.displayObject.skew; }

  public set skew(skew) { this.displayObject.skew = skew; }

  public get transform() { return this.displayObject.transform; }

  public set transform(transform) {
    this.displayObject.setTransform(
      transform.position.x, transform.position.y,
      transform.scale.x, transform.scale.y,
      transform.rotation,
      transform.skew.x, transform.skew.y,
      transform.pivot.x, transform.pivot.y
    )
  }

  public get x() { return this.displayObject.x; }

  public set x(x) { this.displayObject.x = x; }

  public get y() { return this.displayObject.y; }

  public set y(y) { this.displayObject.y = y; }

  // #endregion Public Getters And Setters (23)

  // #region Public Methods (1)

  public destroy() {
    if (!this.destroyed) {
      this.displayObject.destroy();
      StageManager.StageObjects.delete(this.id);
    }
  }

  // #endregion Public Methods (1)
}