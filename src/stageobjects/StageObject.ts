import { CannotDeserializeError } from "../errors";
import { ScreenSpaceCanvasGroup } from "../ScreenSpaceCanvasGroup";
import { SocketManager } from "../SocketManager";
import { StageManager } from "../StageManager";
import { SerializedStageObject, SerializedTransform, StageLayer } from "../types";

export abstract class StageObject {
  // #region Properties (10)

  private _draggable = true;
  private _highlighted = false;
  private _selected = false;

  protected _id = foundry.utils.randomID();
  protected interfaceContainer = new PIXI.Container();

  public readonly resizable = true;

  public static type = "UNKNOWN";

  // public readonly id = foundry.utils.randomID();
  public dragging = false;
  public placing = false;
  public synchronize = false;

  // #endregion Properties (10)

  // #region Constructors (1)

  constructor(protected _displayObject: PIXI.DisplayObject, public name?: string) {
    this.name = name ?? this.id;
    this.displayObject.name = this.name;
    this.displayObject.interactive = true;
    this.displayObject.eventMode = "dynamic";

    this.displayObject.on("destroyed", () => { this.destroy(); });
    this.displayObject.on("pointerdown", this.onPointerDown.bind(this));
    this.displayObject.on("pointerenter", this.onPointerEnter.bind(this));
    this.displayObject.on("pointerleave", this.onPointerLeave.bind(this));
    // this.displayObject.on("prerender", this.onPreRender.bind(this));
    canvas?.app?.renderer.addListener("prerender", this.onPreRender.bind(this));

    // Set up UI frame.
    const frame = new PIXI.Container();
    frame.name = this.name;
    frame.eventMode = "passive";
    frame.visible = false;

    const interaction = frame.addChild(new PIXI.Container());
    interaction.name = "interaction";
    interaction.eventMode = "auto";
    interaction.hitArea = frame.getBounds(true);

    const border = frame.addChild(new PIXI.Graphics());
    border.eventMode = "none";
    border.name = "border";

    const handle = frame.addChild(new ResizeHandle([1, 1]));
    handle.eventMode = "static";
    handle.name = "handle";
    handle.visible = false;

    // frame.visible = false;
    this.interfaceContainer = frame;
    if (StageManager.uiCanvasGroup instanceof ScreenSpaceCanvasGroup) StageManager.uiCanvasGroup.addChild(frame);
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (32)

  /** Object's rotation, in degrees */
  public get angle() { return this.displayObject.angle; }

  public set angle(angle) { this.displayObject.angle = angle; }

  public get bounds() { return this.displayObject.getBounds(); }

  public get controlled() { return this.selected; }

  public set controlled(value) { this.selected = value; }

  public get destroyed() { return this.displayObject.destroyed; }

  public get displayObject() { return this._displayObject; }

  public get draggable() { return this._draggable; }

  public set draggable(draggable) {
    this._draggable = draggable;
    if (this.dragging) this.dragging = false;
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get height() { return 0; }

  public get highlighted() { return this._highlighted; }

  public set highlighted(value) {
    this._highlighted = value;
    if (value) {
      this.interfaceContainer.visible = true;
      this.interfaceContainer.interactiveChildren = true;
    } else if (!this.selected) {
      this.interfaceContainer.visible = false;
      this.interfaceContainer.interactiveChildren = false;
    }
  }


  public get layer() {
    if (this.displayObject.parent instanceof ScreenSpaceCanvasGroup) {
      return this.displayObject.parent.layer;
    } else {
      return "";
    }
  }

  public get owners() { return StageManager.getOwners(this.id).reduce((prev: User[], curr: string) => game?.users?.get(curr) ? [...prev, game.users.get(curr) as User] : prev, [] as User[]); }

  public get pivot() { return this.displayObject.pivot; }

  public set pivot(pivot) { this.displayObject.pivot = pivot; }

  /** Object's rotation, in radians  */
  public get rotation() { return this.displayObject.rotation; }

  public set rotation(rotation) { this.displayObject.rotation = rotation; }

  public get scale() { return this.displayObject.scale; }

  public set scale(scale) { this.displayObject.scale = scale; }

  public get selected() { return this._selected; }

  public set selected(value) {
    this._selected = value;
    if (value) {
      this.interfaceContainer.visible = true;
      this.interfaceContainer.interactiveChildren = true;
      const handle = this.interfaceContainer.children.find(child => child.name === "handle");
      if (handle) handle.visible = true;
    } else {
      if (!this.highlighted) {
        this.interfaceContainer.visible = false;
        this.interfaceContainer.interactiveChildren = false;
      }
      const handle = this.interfaceContainer.children.find(child => child.name === "handle");
      if (handle) handle.visible = false;
    }
  }

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

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get width() { return 0; }

  public get x() { return this.displayObject.x; }

  public set x(x) { this.displayObject.x = x; }

  public get y() { return this.displayObject.y; }

  public set y(y) { this.displayObject.y = y; }

  // #endregion Public Getters And Setters (32)

  // #region Protected Getters And Setters (6)

  protected get bottom() { return this.y + this.height; }

  protected set id(id) { this._id = id; }
  public get id() { return this._id; }

  protected get left() { return this.x; }

  protected get right() { return this.x + this.width; }

  protected get selectTool() {
    if (this.displayObject.parent instanceof ScreenSpaceCanvasGroup) {
      return this.displayObject.parent.selectTool;
    } else {
      return "";
    }
  }

  protected get top() { return this.y; }

  // #endregion Protected Getters And Setters (6)

  // #region Public Static Methods (1)

  public static deserialize(serialized: SerializedStageObject): StageObject { throw new CannotDeserializeError(serialized.type) }

  // #endregion Public Static Methods (1)

  // #region Public Methods (4)

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

  public destroy() {
    if (!this.destroyed) {
      if (!this.displayObject.destroyed) this.displayObject.destroy();
      canvas?.app?.renderer.removeListener("prerender", this.onPreRender.bind(this));
      // StageManager.StageObjects.delete(this.id);
      StageManager.removeStageObject(this);
    }
  }

  public serialize(): SerializedStageObject {
    return {
      id: this.id,
      layer: this.layer as StageLayer ?? "primary",
      owners: StageManager.getOwners(this.id),
      version: __MODULE_VERSION__,
      type: "",
      name: this.name ?? this.id,
      data: {
        transform: {
          x: this.x,
          y: this.y,
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

  public setLayer(layer: StageLayer) {
    if (this.layer !== layer) StageManager.setStageObjectLayer(this, layer);
  }

  // #endregion Public Methods (4)

  // #region Protected Methods (4)

  protected onPointerDown(e: PIXI.FederatedPointerEvent) {
    if (this.placing) {
      e.preventDefault();
      this.placing = false;
      SocketManager.addStageObject(this);
    } else {
      if (
        this.draggable &&
        StageManager.canModifyStageObject(game?.user?.id ?? "", this.id) &&
        game.activeTool === this.selectTool
      ) {
        e.preventDefault();
        this.dragging = true;
        this.synchronize = false;
      }
      if (StageManager.canModifyStageObject(game?.user?.id ?? "", this.id)) {
        this.selected = true;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onPointerEnter(e: PIXI.FederatedPointerEvent) {
    if (game.activeTool === this.selectTool && StageManager.canModifyStageObject(game.user?.id ?? "", this.id)) {
      this.highlighted = true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onPointerLeave(e: PIXI.FederatedPointerEvent) {
    if (this.highlighted) this.highlighted = false;
  }

  protected onPreRender() {
    if (this.destroyed) return;
    // Update interface container location
    if (this.interfaceContainer.visible && this.interfaceContainer.renderable) {
      // this.interfaceContainer.x = this.x;
      // this.interfaceContainer.y = this.y;

      const handle = this.interfaceContainer.children.find(child => child.name === "handle");
      if (handle instanceof ResizeHandle) {
        handle.x = this.right;
        handle.y = this.bottom;
      }

      const border = this.interfaceContainer.children.find(child => child.name === "border");
      if (border instanceof PIXI.Graphics) {
        border.tint = this.selected ? CONFIG.Canvas.dispositionColors.CONTROLLED : this.highlighted ? CONFIG.Canvas.dispositionColors.HOSTILE : CONFIG.Canvas.dispositionColors.INACTIVE;

        const thickness = CONFIG.Canvas.objectBorderThickness;

        const bounds = new PIXI.Rectangle(this.left - thickness, this.top - thickness, this.width + thickness * 2, this.height + thickness * 2);
        border.clear();
        border.lineStyle({ width: thickness, color: 0x000000, join: PIXI.LINE_JOIN.ROUND, alignment: 0.75 })
          .drawShape(bounds);
        border.lineStyle({ width: thickness / 2, color: 0xFFFFFF, join: PIXI.LINE_JOIN.ROUND, alignment: 1 })
          .drawShape(bounds);
      }
    }
  }

  // #endregion Protected Methods (4)
}