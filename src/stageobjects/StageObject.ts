import { StageManager } from "../StageManager";

export abstract class StageObject {
  // #region Properties (3)


  private _draggable = true;
  private _dragging = false;

  public readonly id = foundry.utils.randomID();

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(protected _displayObject: PIXI.DisplayObject, public name: string = this.id) {
    this.displayObject.name = name;
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (21)

  /** Object's rotation, in degrees */
  public get angle() { return this.displayObject.angle; }

  public set angle(angle) { this.displayObject.angle = angle; }

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

  // #endregion Public Getters And Setters (21)

  // #region Public Methods (1)

  public get destroyed() { return this.displayObject.destroyed; }

  public destroy() {
    if (!this.destroyed) {
      this.displayObject.destroy();
      StageManager.StageObjects.delete(this.id);
    }
  }

  // #endregion Public Methods (1)
}