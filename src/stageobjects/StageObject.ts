import { CannotDeserializeError } from "../errors";
import { closeAllContextMenus, localize, registerContextMenu } from "../functions";
import { ScreenSpaceCanvasGroup } from "../ScreenSpaceCanvasGroup";
import { SocketManager } from "../SocketManager";
import { StageManager } from "../StageManager";
import { ScreenAnchors, SerializedStageObject, StageLayer } from "../types";

export abstract class StageObject {
  // #region Properties (15)

  private _draggable = true;
  private _highlighted = false;
  private _locked = false;
  private _resizable = false;
  private _selected = false;

  protected scaledDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  public pin = {
    right: false,
    top: false,
    left: false,
    bottom: false
  }

  public restrictToVisualArea = false;

  protected _id = foundry.utils.randomID();
  protected _originalScreenHeight: number;
  protected _originalScreenWidth: number;

  public preserveAspectRatio = true;

  public readonly interfaceContainer = new PIXI.Container();

  // public readonly resizable: boolean = false;
  public static type = "UNKNOWN";

  // public readonly id = foundry.utils.randomID();
  public dragging = false;
  public placing = false;
  public resizing = false;
  public screenAnchor: ScreenAnchors = ScreenAnchors.None;
  public synchronize = false;

  // #endregion Properties (15)

  // #region Constructors (1)

  constructor(protected _displayObject: PIXI.DisplayObject, public name?: string) {
    this.name = name ?? this.id;
    this.displayObject.name = this.name;
    this.displayObject.interactive = true;
    this.displayObject.eventMode = "dynamic";

    this.displayObject.on("destroyed", () => { this.destroy(); })
    this.displayObject.on("pointerdown", this.onPointerDown.bind(this))
    this.displayObject.on("pointerenter", this.onPointerEnter.bind(this))
    this.displayObject.on("pointerleave", this.onPointerLeave.bind(this))
    this.displayObject.on("rightdown", this.onContextMenu.bind(this))
      ;
    // this.displayObject.on("prerender", this.onPreRender.bind(this));
    // canvas?.app?.renderer.addListener("prerender", this.onPreRender.bind(this))

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

    handle.addListener("pointerenter", () => {
      handle.scale.set(1.5, 1.5);
    }).addListener("pointerout", () => {
      handle.scale.set(1.0, 1.0);
    })
      .addListener("touchstart", this.onHandleDragStart.bind(this))
      .addListener("mousedown", this.onHandleDragStart.bind(this))
    // .addListener("touchmove", this.onHandleDragMove.bind(this))
    // .addListener("mousemove", this.onHandleDragMove.bind(this))
    // .addListener("mouseup", this.onHandleDragEnd.bind(this))
    // .addListener("touchend", this.onHandleDragEnd.bind(this))
    // .addListener("touchcancel", this.onHandleDragEnd.bind(this))

    // frame.visible = false;
    this.interfaceContainer = frame;
    if (StageManager.uiCanvasGroup instanceof ScreenSpaceCanvasGroup) StageManager.uiCanvasGroup.addChild(frame);

    this._originalScreenWidth = window.innerWidth;
    this._originalScreenHeight = window.innerHeight;
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (43)

  /** Object's rotation, in degrees */
  public get angle() { return this.displayObject.angle; }

  public set angle(angle) { this.displayObject.angle = angle; }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get baseHeight(): number { return 0; }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get baseWidth(): number { return 0; }

  public get bottom() { return this.y; }
  public set bottom(bottom) {
    this.y = bottom;
    this.scaledDimensions.y = this.bottom / (this.restrictToVisualArea ? StageManager.VisualBounds.height : window.innerHeight);
  }

  public get bounds() { return this.displayObject.getBounds(); }

  public get controlled() { return this.selected; }

  public set controlled(value) { this.selected = value; }

  public get destroyed() { return this.displayObject.destroyed; }

  public get displayObject() { return this._displayObject; }

  public get draggable() { return !this.locked && this._draggable; }

  public set draggable(draggable) {
    this._draggable = draggable;
    if (this.dragging) this.dragging = false;
  }

  public get height() { return 0; }
  public set height(height) { this.scaledDimensions.height = height / window.innerHeight; }

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

  public get left() { return this.x; }
  public set left(left) {
    this.x = left;
    this.scaledDimensions.x = this.x / (this.restrictToVisualArea ? StageManager.VisualBounds.width : window.innerWidth);
  }



  public get owners() { return StageManager.getOwners(this.id).reduce((prev: User[], curr: string) => game?.users?.get(curr) ? [...prev, game.users.get(curr) as User] : prev, [] as User[]); }

  public get pivot() { return this.displayObject.pivot; }

  public set pivot(pivot) { this.displayObject.pivot = pivot; }

  public get resizable() { return !this.locked && this._resizable; }

  public set resizable(resizable) {
    this._resizable = resizable;
    if (!resizable) {
      if (this.resizeHandle) this.resizeHandle.visible = false;
    }
  }

  public get right() { return this.x + this.width; }
  public set right(right) {
    this.x = right;
    this.scaledDimensions.x = this.x / (this.restrictToVisualArea ? StageManager.VisualBounds.width : window.innerWidth);
  }

  /** Object's rotation, in radians  */
  public get rotation() { return this.displayObject.rotation; }

  public set rotation(rotation) { this.displayObject.rotation = rotation; }

  public get scale() { return this.displayObject.scale; }

  public get selected() { return this._selected; }

  public set selected(value) {
    this._selected = value;
    if (value) {
      this.interfaceContainer.visible = true;
      this.interfaceContainer.interactiveChildren = true;

      if (this.resizeHandle && this.resizable) this.resizeHandle.visible = true;
    } else {
      if (!this.highlighted) {
        this.interfaceContainer.visible = false;
        this.interfaceContainer.interactiveChildren = false;
      }

      if (this.resizeHandle) this.resizeHandle.visible = false;
    }
  }

  public get skew() { return this.displayObject.skew; }

  public set skew(skew) { this.displayObject.skew = skew; }

  public get top() { return this.y; }
  public set top(top) {
    this.y = top;
    this.scaledDimensions.y = top / (this.restrictToVisualArea ? StageManager.VisualBounds.height : window.innerHeight);
  }

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

  public get width() { return 0 }
  public set width(width) { this.scaledDimensions.width = width / window.innerWidth; }


  public get x() { return this.displayObject.x; }
  public set x(x) {
    this.displayObject.x = x;
    this.scaledDimensions.x = x / window.innerWidth;
  }

  public get y() { return this.displayObject.y; }
  public set y(y) {
    this.displayObject.y = y;
    this.scaledDimensions.y = y / window.innerHeight;
  }

  // #endregion Public Getters And Setters (43)

  // #region Protected Getters And Setters (5)

  protected get contextMenuItems(): ContextMenuEntry[] {
    return [
      {
        name: localize("STAGEMANAGER.MENUS.LOCKOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-lock"></i>`,
        callback: () => { this.locked = true; },
        condition: !this.locked
      },
      {
        name: localize("STAGEMANAGER.MENUS.UNLOCKOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-lock-open"></i>`,
        callback: () => { this.locked = false; },
        condition: this.locked
      },
      {
        name: localize("STAGEMANAGER.MENUS.DELETEOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-trash"></i>`,
        callback: () => { StageManager.removeStageObject(this); },
        condition: () => StageManager.canDeleteStageObject(game.user?.id ?? "", this.id)
      }
    ];
  }

  protected set id(id) { this._id = id; }
  public get id() { return this._id; }

  public get locked(): boolean { return this._locked; }
  protected set locked(value) {
    this._locked = value;
    if (value && this.resizeHandle) this.resizeHandle.visible = false;
    else if (this.selected && this.resizeHandle) this.resizeHandle.visible = true;
  }

  protected get resizeHandle(): ResizeHandle | undefined { return this.interfaceContainer?.children.find(item => item.name === "handle") as ResizeHandle; }

  protected get selectTool() {
    if (this.displayObject.parent instanceof ScreenSpaceCanvasGroup) {
      return this.displayObject.parent.selectTool;
    } else {
      return "";
    }
  }

  // #endregion Protected Getters And Setters (5)

  // #region Public Static Methods (1)

  public static deserialize(serialized: SerializedStageObject): StageObject { throw new CannotDeserializeError(serialized.type) }

  // #endregion Public Static Methods (1)

  // #region Public Methods (6)

  public deserialize(serialized: SerializedStageObject) {
    this.name = serialized.name;
    this.id = serialized.id;
    this.locked = !!serialized.data.locked;

    const dimensions = serialized.data.dimensions as { x: number, y: number, width: number, height: number } | undefined;
    if (dimensions) {
      this.x = window.innerWidth * dimensions.x;
      this.y = window.innerHeight * dimensions.y;
    }
  }

  public destroy() {
    if (!this.destroyed) {
      if (!this.displayObject.destroyed) this.displayObject.destroy();
      // StageManager.StageObjects.delete(this.id);
      StageManager.removeStageObject(this);
      if (!this.interfaceContainer.destroyed) this.interfaceContainer.destroy();
    }
  }

  /**
   * Scales the current rotation to a number from 0-360 degrees (0-2π radians)
   */
  public normalizeRotation() {
    this.angle = this.angle % 360;
  }


  public scaleToScreen() {
    // Calculate and apply a new transform.

    const width = this.restrictToVisualArea ? StageManager.VisualBounds.width : window.innerWidth;
    const height = this.restrictToVisualArea ? StageManager.VisualBounds.height : window.innerHeight;

    this.width = this.scaledDimensions.width * width;
    this.height = this.scaledDimensions.height * height;
    this.x = this.scaledDimensions.x * width;
    this.y = this.scaledDimensions.y * height;

    this.sizeInterfaceContainer();
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
        locked: this.locked,
        dimensions: this.scaledDimensions
      }
    }
  }

  public setLayer(layer: StageLayer) {
    if (this.layer !== layer) StageManager.setStageObjectLayer(this, layer);
  }

  // #endregion Public Methods (6)

  // #region Protected Methods (7)

  protected onContextMenu(event: PIXI.FederatedMouseEvent) {
    if (game.activeTool !== this.selectTool) return;

    const elem = document.createElement("section");
    elem.style.position = "absolute";
    elem.style.pointerEvents = "auto";

    $("#sm-menu-container").append(elem);
    elem.style.top = `${event.clientY}px`;
    elem.style.left = `${event.clientX}px`;
    elem.dataset.object = this.id;

    const hasItems = this.contextMenuItems.some(item => typeof item.condition === "function" ? item.condition($(elem)) : typeof item.condition === "boolean" ? item.condition : true);
    if (!hasItems) return;

    event.preventDefault();

    const menu = new ContextMenu(
      $(`#sm-menu-container`),
      `[data-object="${this.id}"]`,
      this.contextMenuItems,
      { onClose: () => { elem.remove(); }, }
    );
    const render = menu.render($(`#sm-menu-container [data-object="${this.id}"]`));
    if (render instanceof Promise) {
      void render.then(() => {
        const listener = (e: MouseEvent) => {
          const elems = document.elementsFromPoint(e.clientX, e.clientY);

          if (!elems.includes(menu.element[0])) {
            document.removeEventListener("mousedown", listener);
            void menu.close();
          }
        }
        document.addEventListener("mousedown", listener);
        return closeAllContextMenus()
      })
        .then(() => { registerContextMenu(menu); })
        .catch((err: Error) => {
          ui.notifications?.error(err.message, { console: false, localize: true });
          console.error(err);
        })
    } else {
      void closeAllContextMenus()
        .then(() => registerContextMenu(menu))
        .catch((err: Error) => {
          ui.notifications?.error(err.message, { console: false, localize: true });
          console.error(err);
        });
    }
  }

  protected onHandleDragEnd(e: PIXI.FederatedMouseEvent) {
    e.preventDefault();
    this.resizing = false;
    this.synchronize = true;
  }

  protected onHandleDragStart(e: PIXI.FederatedMouseEvent) {
    e.preventDefault();
    this.resizing = true;
    this.synchronize = false;
  }

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
      if (StageManager.canModifyStageObject(game?.user?.id ?? "", this.id) && game.activeTool === this.selectTool) {
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

  public sizeInterfaceContainer() {
    if (this.destroyed) return;
    // Update interface container location
    if (this.interfaceContainer.visible && this.interfaceContainer.renderable) {
      if (this.resizeHandle) {
        this.resizeHandle.x = this.right;
        this.resizeHandle.y = this.bottom;
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

  // #endregion Protected Methods (7)
}