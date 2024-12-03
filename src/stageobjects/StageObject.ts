export abstract class StageObject {
  public readonly id = foundry.utils.randomID();

  public get displayObject() { return this._displayObject; }

  public get x() { return this.displayObject.x; }
  public set x(x) { this.displayObject.x = x; }

  public get y() { return this.displayObject.y; }
  public set y(y) { this.displayObject.y = y; }

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


  private _draggable = true;
  private _dragging = false;
  public get draggable() { return this._draggable; }
  public set draggable(draggable) {
    this._draggable = draggable;
    if (this.dragging) this.dragging = false;
  }

  public get dragging() { return this._dragging; }
  public set dragging(dragging) {
    this._dragging = dragging;
  }

  public get skew() { return this.displayObject.skew; }
  public set skew(skew) { this.displayObject.skew = skew; }

  public get scale() { return this.displayObject.scale; }
  public set scale(scale) { this.displayObject.scale = scale; }

  public get pivot() { return this.displayObject.pivot; }
  public set pivot(pivot) { this.displayObject.pivot = pivot; }

  /** Object's rotation, in degrees */
  public get angle() { return this.displayObject.angle; }
  public set angle(angle) { this.displayObject.angle = angle; }

  /** Object's rotation, in radians  */
  public get rotation() { return this.displayObject.rotation; }
  public set rotation(rotation) { this.displayObject.rotation = rotation; }

  constructor(protected _displayObject: PIXI.DisplayObject, public name: string = this.id) {
    this.displayObject.name = name;
  }
}