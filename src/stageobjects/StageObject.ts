import { CannotDeserializeError, InvalidStageObjectError } from "../errors";
import { closeAllContextMenus, localize, registerContextMenu } from "../functions";
import { ScreenSpaceCanvasGroup } from "../ScreenSpaceCanvasGroup";
import { StageManager } from "../StageManager";
import { SerializedStageObject, StageLayer } from "../types";

type PinHashCallback = (left: boolean, right: boolean, top: boolean, bottom: boolean) => void;

class PinHash {
  #left = false;
  #right = false;
  #top = false;
  #bottom = false;

  public get left() { return this.#left; }
  public set left(val) {
    this.#left = val;
    this.#callCB();
  }

  public get right() { return this.#right; }
  public set right(val) {
    this.#right = val;
    this.#callCB();
  }

  public get top() { return this.#top; }
  public set top(val) {
    this.#top = val;
    this.#callCB();
  }

  public get bottom() { return this.#bottom; }
  public set bottom(val) {
    this.#bottom = val;
    this.#callCB();
  }


  #cb: PinHashCallback
  #callCB() {
    this.#cb(this.left, this.right, this.top, this.bottom);
  }
  constructor(cb: PinHashCallback) {
    this.#cb = cb;
  }
}

export abstract class StageObject<t extends PIXI.DisplayObject = PIXI.DisplayObject> {
  // #region Properties (15)

  private _leftPinPos = -1;
  private _rightPinPos = -1;
  private _topPinPos = -1;
  private _bottomPinPos = -1;

  private _draggable = true;
  private _highlighted = false;
  private _locked = false;
  private _resizable = false;
  private _selected = false;
  private _dragging = false;
  private _placing = false;
  private _dragAlpha = 1;

  protected scaledDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  protected readonly pin = new PinHash(this.onPinChange.bind(this));

  public restrictToVisualArea = false;

  protected _id = foundry.utils.randomID();
  protected _originalScreenHeight: number;
  protected _originalScreenWidth: number;

  private onPinChange(left: boolean, right: boolean, top: boolean, bottom: boolean) {
    if (left) this._leftPinPos = this.left;
    else this._leftPinPos = -1;

    if (right) this._rightPinPos = this.right;
    else this._rightPinPos = -1;

    if (top) this._topPinPos = this.top;
    else this._topPinPos = -1;

    if (bottom) this._bottomPinPos = this.bottom;
    else this._bottomPinPos = -1;
  }

  public preserveAspectRatio = true;

  public readonly interfaceContainer = new PIXI.Container();

  // public readonly resizable: boolean = false;
  public static type = "UNKNOWN";

  // public readonly id = foundry.utils.randomID();

  public get dragging() { return this._dragging && this.draggable; }
  public set dragging(val) {
    if (this.draggable) this._dragging = val;
    if (!val && this._dragGhost) this._dragGhost.destroy();
  }

  public get placing() { return this._placing; }
  public set placing(val) {
    if (val) {
      this._dragAlpha = this.alpha;
      if (this.alpha > 0.5) this.alpha = 0.5;
      this._placing = true;
    } else {
      this.alpha = this._dragAlpha;
      this._placing = false;
      this.bringToFront();
    }
  }

  public get alpha() { return this.displayObject.alpha; }
  public set alpha(val) { this.displayObject.alpha = val; }

  public get opacity() { return this.alpha; }
  public set opacity(val) { this.alpha = val; }


  public resizing = false;
  public synchronize = false;

  public get zIndex() { return this.displayObject.zIndex; }
  public set zIndex(z) { this.displayObject.zIndex = z; }

  /** Brings this object to the front of the zIndex order for its {@link StageLayer} */
  public bringToFront() {
    if (!this.layer) return;
    const highest = StageManager.StageObjects.highestObjects(this.layer);
    if (highest.length === 0) throw new InvalidStageObjectError(highest[0]);

    // If this object is already at the front of all other objects on its layer, do nothing
    if (highest.length === 1 && highest.includes(this)) return;
    this.zIndex = highest[0].zIndex + 1;
  }

  /** Sends this object to the back of the zIndex order for its {@link StageLayer} */
  public sendToBack() {
    if (!this.layer) return;
    const lowest = StageManager.StageObjects.lowestObjects(this.layer);
    if (lowest.length === 0) throw new InvalidStageObjectError(lowest[0]);

    // If we are already at the back, do nothing
    if (lowest.length === 1 && lowest.includes(this)) return;
    this.zIndex = lowest[0].zIndex - 1;
  }

  // #endregion Properties (15)

  public abstract createDragGhost(): t;

  // #region Constructors (1)
  protected addDisplayObjectListeners() {
    this.displayObject
      .on("destroyed", this.destroy.bind(this))
      .on("pointerdown", this.onPointerDown.bind(this))
      .on("pointerenter", this.onPointerEnter.bind(this))
      .on("pointerleave", this.onPointerLeave.bind(this))
      .on("rightdown", this.onContextMenu.bind(this))
      ;
  }

  protected removeDisplayObjectListeners() {
    if (this.displayObject) {
      this.displayObject
        .off("destroyed", this.destroy.bind(this))
        .off("pointerdown", this.onPointerDown.bind(this))
        .off("pointerenter", this.onPointerEnter.bind(this))
        .off("pointerleave", this.onPointerLeave.bind(this))
        .off("rightdown", this.onContextMenu.bind(this))
        ;
    }
  }

  constructor(protected _displayObject: t, public name?: string) {
    this.name = name ?? this.id;
    this.displayObject.name = this.name;
    this.displayObject.interactive = true;
    this.displayObject.eventMode = "dynamic";

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
    this.updateScaledDimensions();
    this.updatePinLocations();
  }

  public get bounds() { return this.displayObject.getBounds(); }

  public get controlled() { return this.selected; }

  public set controlled(value) { this.selected = value; }

  public get destroyed() { return this.displayObject.destroyed; }

  public get displayObject() { return this._displayObject; }
  protected set displayObject(val) {

    if (this._displayObject) {
      this.removeDisplayObjectListeners();
      val.setParent(this._displayObject.parent);

      const { skew, alpha, angle, x, y, pivot } = this._displayObject;
      val.skew.x = skew.x;
      val.skew.y = skew.y;
      val.alpha = alpha;
      val.angle = angle;
      val.x = x;
      val.y = y;
      val.pivot.x = pivot.x;
      val.pivot.y = pivot.y;
      this._displayObject.destroy();
    }

    this._displayObject = val;
    this.addDisplayObjectListeners();

  }

  public get draggable() { return !this.locked && this._draggable; }

  public set draggable(draggable) {
    this._draggable = draggable;
    if (this.dragging) this.dragging = false;
  }

  public get height() { return 0; }
  public set height(height) {
    this.updateScaledDimensions();
    this.updatePinLocations();
  }

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
    this.updateScaledDimensions();
    this.updatePinLocations();
  }




  public get owners() { return StageManager.getOwners(this.id).reduce((prev: User[], curr: string) => game?.users?.get(curr) ? [...prev, game.users.get(curr) as User] : prev, [] as User[]); }
  protected set owners(val) { void StageManager.setOwners(this.id, val.map(user => user.id ?? "")); }

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
    // this.x = right;
    this.x = this.actualBounds.right - right;
    this.updateScaledDimensions();
    this.updatePinLocations();
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
    this.updateScaledDimensions();
    this.updatePinLocations();
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
  public set width(width) {
    this.updateScaledDimensions();
    this.updatePinLocations();
  }

  protected updateScaledDimensions() {
    this.scaledDimensions.x = this.x / this.actualBounds.width;
    this.scaledDimensions.y = this.y / this.actualBounds.height;
    this.scaledDimensions.width = this.width / this.actualBounds.width;
    this.scaledDimensions.height = this.height / this.actualBounds.height;
  }

  protected updatePinLocations() {
    if (this.pin.left) this._leftPinPos = this.left;
    if (this.pin.right) this._rightPinPos = this.right;
    if (this.pin.top) this._topPinPos = this.top;
    if (this.pin.bottom) this._bottomPinPos = this.bottom;
  }

  public get x() { return this.displayObject.x; }
  public set x(x) {
    this.displayObject.x = x;
    this.updateScaledDimensions();
    this.updatePinLocations();
  }

  public get y() { return this.displayObject.y; }
  public set y(y) {
    this.displayObject.y = y;
    this.updateScaledDimensions();
    this.updatePinLocations();
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

  public get resizeHandle(): ResizeHandle | undefined { return this.interfaceContainer?.children.find(item => item.name === "handle") as ResizeHandle; }

  public get selectTool() {
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
    this.id = serialized.id;
    this.name = serialized.name;
    // void StageManager.setOwners(this.id, serialized.owners);
    this.setLayer(serialized.layer ?? "primary");
    this.restrictToVisualArea = serialized.restrictToVisualArea;
    this.scaledDimensions.x = serialized.bounds.x;
    this.scaledDimensions.y = serialized.bounds.y;
    this.scaledDimensions.width = serialized.bounds.width;
    this.scaledDimensions.height = serialized.bounds.height;
    this.skew.x = serialized.skew.x;
    this.skew.y = serialized.skew.y;
    this.rotation = serialized.rotation;
    this.locked = serialized.locked;
    this.zIndex = serialized.zIndex;

    this.x = serialized.bounds.x * this.actualBounds.width;
    this.y = serialized.bounds.y * this.actualBounds.height;
    this.width = serialized.bounds.width * this.actualBounds.width;
    this.height = serialized.bounds.height * this.actualBounds.height;
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


  protected get actualBounds() { return this.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds; }

  public scaleToScreen() {
    // Calculate and apply a new transform.
    if (this.pin.left && this.pin.right) {
      // Empty
    } else if (this.pin.left) {
      this.left = this._leftPinPos;
    } else if (this.pin.right) {
      this.right = this._rightPinPos;
    }

    if (this.pin.top && this.pin.bottom) {
      // Empty
    } else if (this.pin.top) {
      this.top = this._topPinPos;
    } else if (this.pin.bottom) {
      this.bottom = this._bottomPinPos;
    }

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
      locked: this.locked,
      bounds: { ...this.scaledDimensions },
      rotation: this.rotation,
      restrictToVisualArea: this.restrictToVisualArea,
      filters: [],
      zIndex: this.zIndex,
      skew: {
        x: this.skew.x,
        y: this.skew.y
      }
    }
  }

  public setLayer(layer: StageLayer) {
    if (this.layer !== layer) StageManager.setStageObjectLayer(this, layer);
  }

  // #endregion Public Methods (6)

  // #region Protected Methods (7)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onPointerDown(event: PIXI.FederatedMouseEvent) {
    // if (StageManager.canModifyStageObject(game?.user?.id ?? "", this.id))
    //   this.selected = true;
  }

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

  public get absoluteLeft() { return this.left + this.actualBounds.left; }
  public get absoluteRight() { return this.right + this.actualBounds.left; }
  public get absoluteTop() { return this.top + this.actualBounds.top; }
  public get absoluteBottom() { return this.bottom + this.actualBounds.bottom; }

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

  private _dragGhost: PIXI.DisplayObject | null = null;


  // protected onPointerDown(e: PIXI.FederatedPointerEvent) {

  // }

  // protected onPointerDown(e: PIXI.FederatedPointerEvent) {
  //   if (this.placing) {
  //     e.preventDefault();
  //     this.placing = false;
  //     SocketManager.addStageObject(this);
  //   } else {
  //     if (
  //       this.draggable &&
  //       StageManager.canModifyStageObject(game?.user?.id ?? "", this.id) &&
  //       game.activeTool === this.selectTool
  //     ) {
  //       e.preventDefault();
  //       this.dragging = true;
  //       this.synchronize = false;
  //       const ghost = StageManager.deserialize({
  //         ...this.serialize(),
  //         id: foundry.utils.randomID()
  //       });
  //       if (ghost) {
  //         this._dragGhost = ghost.displayObject;
  //         ghost.synchronize = false;
  //         ghost.locked = true;
  //         ghost.alpha = .5;
  //         ghost.sendToBack();

  //       }
  //     }
  //     if (StageManager.canModifyStageObject(game?.user?.id ?? "", this.id) && game.activeTool === this.selectTool) {
  //       this.selected = true;
  //     }
  //   }
  // }

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
        this.resizeHandle.x = this.absoluteLeft + this.width;
        this.resizeHandle.y = this.absoluteTop + this.height;
      }

      const border = this.interfaceContainer.children.find(child => child.name === "border");
      if (border instanceof PIXI.Graphics) {
        border.tint = this.selected ? CONFIG.Canvas.dispositionColors.CONTROLLED : CONFIG.Canvas.dispositionColors.INACTIVE;  //this.highlighted ? CONFIG.Canvas.dispositionColors.INACTIVE : CONFIG.Canvas.dispositionColors.INACTIVE;

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