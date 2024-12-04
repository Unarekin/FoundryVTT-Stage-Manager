import { CannotDeserializeError } from "../errors";
import { ScreenSpaceCanvasGroup } from "../ScreenSpaceCanvasGroup";
import { SocketManager } from "../SocketManager";
import { StageManager } from "../StageManager";
import { SerializedStageObject, SerializedTransform, StageLayer } from "../types";

export abstract class StageObject {
  // #region Properties (5)

  private _draggable = true;
  public synchronize = false;

  protected _id = foundry.utils.randomID();
  public get id() { return this._id; }
  protected set id(id) { this._id = id; }

  // public readonly id = foundry.utils.randomID();

  public dragging = false;
  public placing = false;
  public static type = "UNKNOWN";

  // #endregion Properties (5)

  // #region Constructors (1)

  constructor(protected _displayObject: PIXI.DisplayObject, public name?: string) {
    this.name = name ?? this.id;
    this.displayObject.name = this.name;
    this.displayObject.interactive = true;
    this.displayObject.eventMode = "dynamic";

    this.displayObject.on("pointerdown", () => {
      if (this.placing) {
        this.placing = false;

        SocketManager.addStageObject(this);
      }
    });
    this.displayObject.on("destroyed", () => { this.destroy(); });

    if (this.draggable) {
      this.displayObject.on("pointerdown", e => {
        if (game && game.activeTool === this.selectTool) {
          this.dragging = true;
          this.synchronize = false;
          e.preventDefault();
        }
      });
    }
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (21)

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

  public get layer() {
    if (this.displayObject.parent instanceof ScreenSpaceCanvasGroup) {
      return this.displayObject.parent.layer;
    } else {
      return "";
    }
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

  // #region Protected Getters And Setters (1)

  protected get selectTool() {
    if (this.displayObject.parent instanceof ScreenSpaceCanvasGroup) {
      return this.displayObject.parent.selectTool;
    } else {
      return "";
    }
  }

  // #endregion Protected Getters And Setters (1)

  // #region Public Methods (2)

  public destroy() {
    if (!this.destroyed) {
      if (!this.displayObject.destroyed) this.displayObject.destroy();
      StageManager.StageObjects.delete(this.id);
    }
  }

  public setLayer(layer: StageLayer) {
    if (this.layer !== layer) StageManager.setStageObjectLayer(this, layer);
  }

  // #endregion Public Methods (2)


  public static deserialize(serialized: SerializedStageObject): StageObject { throw new CannotDeserializeError(serialized.type) }

  public deserialize(serialized: SerializedStageObject) {
    this.name = serialized.name;
    this.id = serialized.id;

    const transform = serialized.data.transform as SerializedTransform;

    if (transform) {
      this.displayObject.setTransform(
        transform.x,
        transform.y,
        transform.scaleX,
        transform.scaleY,
        transform.rotation,
        transform.skewX,
        transform.skewY,
        transform.pivotX,
        transform.pivotY
      );
    }
  }

  // #region Public Abstract Methods (1)


  public serialize(): SerializedStageObject {
    return {
      id: this.id,
      layer: this.layer as StageLayer ?? "primary",
      version: __MODULE_VERSION__,
      type: "",
      name: this.name ?? this.id,
      data: {
        transform: {
          x: this.transform.position.x,
          y: this.transform.position.y,
          scaleX: this.transform.scale.x,
          scaleY: this.transform.scale.y,
          rotation: this.transform.rotation,
          skewX: this.transform.skew.x,
          skewY: this.transform.skew.y,
          pivotX: this.transform.pivot.x,
          pivotY: this.transform.pivot.y

        }
      }
    }
  }

  // #endregion Public Abstract Methods (1)
}