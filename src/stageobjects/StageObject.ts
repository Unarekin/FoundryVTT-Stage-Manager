import { CannotDeserializeError, CanvasNotInitializedError, InvalidStageObjectError } from "../errors";
import { closeAllContextMenus, localize, registerContextMenu } from "../functions";
import { ScreenSpaceCanvasGroup } from "../ScreenSpaceCanvasGroup";
import { StageManager } from "../StageManager";
import { Scope, SerializedStageObject, SerializedTrigger, StageLayer, TriggerEventSignatures } from '../types';
import { PinHash } from "./PinHash";
import deepProxy from "../lib/deepProxy";
import { CUSTOM_HOOKS } from "../hooks";
import * as tempTriggers from "../triggeractions";
import { StageManagerControlsLayer } from "../ControlButtonsHandler";
import { log, logError } from "../logging";
import { getTriggerActionType } from "../applications/functions";
// import { getTriggerActionType } from "../applications/functions";


const TriggerActions = Object.fromEntries(Object.values(tempTriggers).map(val => [val.type, val]));

const KNOWN_OBJECTS: Record<string, StageObject> = {};

export abstract class StageObject<t extends PIXI.DisplayObject = PIXI.DisplayObject> {
  // #region Properties (15)

  public toString() { return JSON.stringify(this.serialize()); }

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

  protected scaledDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }

  private _dirty = false;
  public get dirty() { return this._dirty; }
  public set dirty(val) {
    this._dirty = val;
  }



  // private _dirty = false;
  // public get dirty() { return this._dirty; }
  // protected set dirty(val) { this._dirty = val; }

  protected readonly pin = new PinHash(this.onPinChange.bind(this));

  private _restrictToVisualArea = false;
  public get restrictToVisualArea() { return this._restrictToVisualArea; }
  public set restrictToVisualArea(val) {
    if (val !== this._restrictToVisualArea) {
      this.dirty = true;
      this._restrictToVisualArea = val;
    }
  }

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
    this.dirty = true;
  }

  private _triggersEnabled = true;
  public get triggersEnabled() { return this._triggersEnabled; }
  public set triggersEnabled(val) {
    if (this.triggersEnabled !== val) {
      this._triggersEnabled = val;
      this.dirty = true;
    }
  }

  // public preserveAspectRatio = true;
  private _preserveAspectRatio = true;
  public get preserveAspectRatio() { return this._preserveAspectRatio; }
  public set preserveAspectRatio(val) {
    if (val !== this._preserveAspectRatio) {
      this.dirty = true;
      this._preserveAspectRatio = val;
    }
  }

  public readonly interfaceContainer = new PIXI.Container();

  // public readonly resizable: boolean = false;
  public static readonly type: string = "UNKNOWN";

  // public readonly id = foundry.utils.randomID();

  public get dragging() { return this._dragging && this.draggable; }
  public set dragging(val) {
    if (this.draggable && val) {
      if (val !== this._dragging) {
        this.dirty = true;
        this._dragging = val;
      }
    } else if (!val) {
      if (val !== this._dragging) {
        this.dirty = true;
        this._dragging = val;
      }
    }
  }

  public get alpha() { return this.displayObject.alpha; }
  public set alpha(val) {
    if (val !== this.alpha) {
      this.dirty = true;
      this.displayObject.alpha = val;
    }
  }

  public get opacity() { return this.alpha; }
  public set opacity(val) {
    if (val !== this.alpha) {
      this.dirty = true;
      this.alpha = val;
    }
  }


  // public resizing = false;
  // public synchronize = false;
  private _resizing = false;
  private _synchronize = false;
  public get resizing() { return this._resizing; }
  public set resizing(val) {
    if (val !== this.resizing) {
      this.dirty = true;
      this._resizing = val;
    }
  }

  public get synchronize() { return this._synchronize; }
  public set synchronize(val) {
    if (val !== this.synchronize) {
      this.dirty = true;
      this._synchronize = val;
    }
  }

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


  protected dblClickDelay = 500;

  protected _clickHandle: NodeJS.Timeout | null = null;


  protected onClick(e: PIXI.FederatedPointerEvent) {
    // Do not trigger when control layer is active
    // if (canvas?.activeLayer instanceof StageManagerControlsLayer) return;

    if (!this._clickHandle) {
      this._clickHandle = setTimeout(() => {
        if (canvas?.activeLayer instanceof StageManagerControlsLayer) return;
        const { x, y } = this.displayObject.toLocal(e);
        this._clickHandle = null;
        void this.triggerEvent("click", { pos: { x, y, clientX: e.clientX, clientY: e.clientY }, modKeys: { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey }, user: game.user as User });
      }, 500);
    } else {
      clearTimeout(this._clickHandle);
      this._clickHandle = null;
      this.onDblClick(e);
    }
  }
  protected onDblClick(e: PIXI.FederatedPointerEvent) {
    if (!(canvas?.activeLayer instanceof StageManagerControlsLayer)) {
      const { x, y } = this.displayObject.toLocal({ x: e.x, y: e.y });
      void this.triggerEvent("doubleClick",
        {
          pos: { x, y, clientX: e.clientX, clientY: e.clientY },
          modKeys: {
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey
          },
          user: game.user as User
        })
    } else if (StageManager.canModifyStageObject(game.user?.id ?? "", this.id)) {
      void StageManager.EditStageObject(this);
    }
  }
  protected onRightClick(e: PIXI.FederatedPointerEvent) {
    if (!(canvas?.activeLayer instanceof StageManagerControlsLayer)) {
      const { x, y } = this.displayObject.toLocal({ x: e.x, y: e.y });
      void this.triggerEvent("rightClick", { pos: { x, y, clientX: e.clientX, clientY: e.clientY }, modKeys: { alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey }, user: game.user as User });
    }
  }

  protected getLocalCoordinates(clientX: number, clientY: number): { x: number, y: number } {
    const { x, y } = this.displayObject.toLocal({ x: clientX, y: clientY });
    return { x, y };
  }

  // private _lastMoveCoords: { x: number, y: number } = { x: -1, y: -1 };
  // private throttledPointerMove: typeof this.onPointerMove | null = null;

  // protected onPointerMove(e: PIXI.FederatedPointerEvent) {
  //   if (this._lastMoveCoords.x === e.clientX && this._lastMoveCoords.y === e.clientY) return;
  //   this._lastMoveCoords.x = e.clientX;
  //   this._lastMoveCoords.y = e.clientY;

  //   if (!this._pointerEntered) {

  //     if (!(canvas?.activeLayer instanceof StageManagerControlsLayer))
  //       void this.triggerEvent("hoverIn", { pos: { x: e.x, y: e.y, clientX: e.clientX, clientY: e.clientY }, user: game.user as User });
  //     else
  //       this.highlighted = true;
  //     this._pointerEntered = true;
  //   }
  // }


  private _pointerEntered = false;
  public abstract createDragGhost(): t;

  // #region Constructors (1)
  protected addDisplayObjectListeners() {
    this.displayObject.interactive = true;
    this.displayObject.eventMode = "dynamic";
    // this.throttledPointerMove = throttle(this.onPointerMove.bind(this), 100);

    this.displayObject
      .on("destroyed", this.destroy.bind(this))
      .on("pointerdown", this.onPointerDown.bind(this))
      .on("pointerenter", this.onPointerEnter.bind(this))
      .on("pointerleave", this.onPointerLeave.bind(this))
      .on("click", this.onClick.bind(this))
      .on("rightclick", this.onRightClick.bind(this))
      .on("rightclick", this.onContextMenu.bind(this))
      // .on("pointermove", this.throttledPointerMove)
      ;
  }

  protected removeDisplayObjectListeners() {
    if (this.displayObject) {
      this.displayObject
        .off("destroyed", this.destroy.bind(this))
        .off("pointerdown", this.onPointerDown.bind(this))
        .off("pointerenter", this.onPointerEnter.bind(this))
        .off("pointerleave", this.onPointerLeave.bind(this))
        .off("click", this.onClick.bind(this))
        .off("rightclick", this.onRightClick.bind(this))
        .off("rightclick", this.onContextMenu.bind(this));
      // if (this.throttledPointerMove)
      //   this.displayObject.off("pointermove", this.throttledPointerMove)
      ;
    }
  }


  // #hookId = 0;

  protected onSynchronize(item: SerializedStageObject) {
    if (item.id === this.id) {
      this.deserialize(item);
      this.dirty = false;
    }
  }

  private _name: string = this.id;
  public get name() { return this._name; }
  public set name(val) {
    if (this._name !== val) {
      this._name = val;
      this.dirty = true;
    }
  }

  protected addHook(event: string, id: number) {
    if (!Array.isArray(this.#hookIds[event])) this.#hookIds[event] = [id];
    else this.#hookIds[event].push(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getTriggerArguments<k extends keyof TriggerEventSignatures>(event: k, args: TriggerEventSignatures[k]): Partial<TriggerEventSignatures[k]> | Record<string, unknown> {
    return {
      stageObject: this.serialize()
    };
  }

  private _triggers: Partial<Record<keyof TriggerEventSignatures, SerializedTrigger[]>> = {

  };
  public get triggers() { return this._triggers; }
  protected set triggers(val) {
    if (!foundry.utils.objectsEqual(this.triggers, val)) {
      this._triggers = val;
      this.dirty = true;
    }
  }

  public async triggerEvent<k extends keyof TriggerEventSignatures>(event: k, args: TriggerEventSignatures[k]) {
    log("Event triggered:", event, args);
    if (this.triggers[event]) {
      for (const trigger of this.triggers[event]) {
        if (TriggerActions[trigger.action]) {
          const triggerClass = getTriggerActionType(trigger);
          if (!triggerClass) continue;
          const scope = {
            ...triggerClass.getArguments(trigger),
            ...this.getTriggerArguments(event, args),
            ...args
          };
          const exec = triggerClass.execute(trigger, scope);
          if (exec instanceof Promise) await exec;
        }
      }
    }
  }


  constructor(private _displayObject: t, name?: string) {
    if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
    this.#displayObject = this.proxyDisplayObject(_displayObject);
    this.#displayObject.interactive = true;
    this.#displayObject.eventMode = "dynamic";
    // // this.createRenderTexture();
    this.addDisplayObjectListeners();


    this._name = name ?? this.id;

    this.addHook(CUSTOM_HOOKS.SYNC_OBJECT, Hooks.on(CUSTOM_HOOKS.SYNC_OBJECT, this.onSynchronize.bind(this)));

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
      .addListener("mouseup", this.onHandleDragEnd.bind(this))
      .addListener("touchend", this.onHandleDragEnd.bind(this))
      .addListener("touchcancel", this.onHandleDragEnd.bind(this))

    // frame.visible = false;
    this.interfaceContainer = frame;
    if (StageManager.uiCanvasGroup instanceof ScreenSpaceCanvasGroup) StageManager.uiCanvasGroup.addChild(frame);

    this._originalScreenWidth = window.innerWidth;
    this._originalScreenHeight = window.innerHeight;
    this.dirty = false;


    KNOWN_OBJECTS[this.id] = this;
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (43)

  /** Object's rotation, in degrees */
  public get angle() { return this.displayObject.angle; }

  public set angle(angle) {
    this.displayObject.angle = angle;
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get baseHeight(): number { return 0; }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get baseWidth(): number { return 0; }

  public get bottom() { return this.y; }
  public set bottom(bottom) {
    if (bottom !== this.y) {
      this.dirty = true;
      this.y = bottom;
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get bounds() { return this.displayObject.getBounds(); }

  public get controlled() { return this.selected; }

  public set controlled(value) { this.selected = value; }

  public get destroyed() { return this.displayObject.destroyed; }

  #displayObject: t;

  // #revokeDisplayProxy
  public get displayObject() { return this.#displayObject; }
  protected set displayObject(val) {
    if (this.#displayObject) {
      this.removeDisplayObjectListeners();

      if (val) {
        val.setParent(this.#displayObject.parent);

        const { skew, alpha, angle, x, y, pivot } = this.#displayObject;
        val.skew.x = skew.x;
        val.skew.y = skew.y;
        val.alpha = alpha;
        val.angle = angle;
        val.x = x;
        val.y = y;
        val.pivot.x = pivot.x;
        val.pivot.y = pivot.y;
        this.#displayObject.destroy();
      }
    }

    if (!val) {
      this.#displayObject = val;
    } else {

      this.#displayObject = this.proxyDisplayObject(val);
      this.#displayObject.name = this.name ?? this.id;
      this.#displayObject.interactive = true;
      this.#displayObject.eventMode = "dynamic";
      // // this.createRenderTexture();
      this.addDisplayObjectListeners();
    }
  }

  // protected createRenderTexture() {
  //   if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
  //   if (this.renderTexture) this.renderTexture.destroy();
  //   this.renderTexture = PIXI.RenderTexture.create({ width: this.baseWidth, height: this.baseHeight });
  //   canvas.app.renderer.render(this._displayObject, { renderTexture: this.renderTexture });
  //   logTexture(this.renderTexture);
  // }

  // eslint-disable-next-line no-unused-private-class-members
  #revokeProxy: (() => void) | null = null;

  #ignoredProperties = ["worldAlpha", "uvs"];

  private proxyDisplayObject(val: t): t {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const temp = this;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (val as any).stageObject = this;
    const { proxy, revoke } = deepProxy<t>(val, {
      set(target, prop, value) {
        if (typeof prop === "string" && !prop.startsWith("_") && !temp.#ignoredProperties.includes(prop))
          temp.dirty = true;

        return Reflect.set(target, prop, value);
      }
    });
    this.#revokeProxy = revoke;
    return proxy
  }

  public get draggable() { return !this.locked && this._draggable; }

  public set draggable(draggable) {
    if (draggable !== this._draggable) this.dirty = true;
    this._draggable = draggable;
    if (this.dragging) this.dragging = false;
  }

  public get height() { return 0; }
  public set height(height) {
    if (height !== this.height) {
      this.dirty = true;
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get highlighted() { return this._highlighted; }

  public set highlighted(value) {
    if (this._highlighted !== value) {
      this._highlighted = value;
      this.dirty = true;
    }
    if (value) {
      this.interfaceContainer.visible = true;
      this.interfaceContainer.interactiveChildren = true;
      this.sizeInterfaceContainer();
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
    if (left !== this.x) {
      this.x = left;
      this.updateScaledDimensions();
      this.updatePinLocations();
      this.dirty = true;
    }
  }




  public get owners() { return StageManager.getOwners(this.id).reduce((prev: User[], curr: string) => game?.users?.get(curr) ? [...prev, game.users.get(curr) as User] : prev, [] as User[]); }
  protected set owners(val) {
    if (!foundry.utils.objectsEqual(this.owners, val)) {
      this.dirty = true;
      void StageManager.setOwners(this.id, val.map(user => user.id ?? ""));
    }

  }

  public get pivot() { return this.displayObject.pivot; }

  public set pivot(pivot) { this.displayObject.pivot = pivot; }

  public get resizable() { return !this.locked && this._resizable; }

  public set resizable(resizable) {
    if (resizable !== this._resizable) {
      this._resizable = resizable;
      this.dirty = true;
    }

    if (!resizable) {
      if (this.resizeHandle) this.resizeHandle.visible = false;
    }
  }

  public get right() { return this.x + this.width; }
  public set right(right) {
    // this.x = right;
    if (this.x !== this.actualBounds.right - right) {
      this.dirty = true;
      this.x = this.actualBounds.right - right;
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  /** Object's rotation, in radians  */
  public get rotation() { return this.displayObject.rotation; }

  public set rotation(rotation) { this.displayObject.rotation = rotation; }

  public get scale() { return this.displayObject.scale; }

  public get selected() { return this._selected; }

  public set selected(value) {
    this._selected = value;
    // this.dirty = true;
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
    if (top !== this.y) {
      this.y = top;
      this.dirty = true;
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get width() { return 0 }
  public set width(width) {
    if (this.width !== width) {
      this.dirty = true;
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
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
        name: localize("STAGEMANAGER.MENUS.EDITOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-cogs"></i>`,
        callback: () => { void StageManager.EditStageObject(this); },
        condition: StageManager.canModifyStageObject(game.user?.id ?? "", this.id)
      },
      // {
      //   name: localize("STAGEMANAGER.MENUS.LOCKOBJECT", { name: this.name ?? this.id }),
      //   icon: `<i class="fas fa-lock"></i>`,
      //   callback: () => { this.locked = true; },
      //   condition: !this.locked
      // },
      // {
      //   name: localize("STAGEMANAGER.MENUS.UNLOCKOBJECT", { name: this.name ?? this.id }),
      //   icon: `<i class="fas fa-lock-open"></i>`,
      //   callback: () => { this.locked = false; },
      //   condition: this.locked
      // },
      {
        name: localize("STAGEMANAGER.MENUS.DELETEOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-trash"></i>`,
        callback: () => { StageManager.removeStageObject(this); },
        condition: () => StageManager.canDeleteStageObject(game.user?.id ?? "", this.id)
      }
    ];
  }

  protected set id(id) {
    if (id !== this._id) {
      this.dirty = true;
      if (Object.keys(KNOWN_OBJECTS).includes(this._id)) delete KNOWN_OBJECTS[this._id];
      this._id = id;
      KNOWN_OBJECTS[id] = this;
    }

  }
  public get id() { return this._id; }

  /**
   * Attempts to locate a StageObject by name or ID.
   * @param id 
   * @returns 
   */
  public static find(id: string): StageObject | undefined {
    if (KNOWN_OBJECTS[id]) return KNOWN_OBJECTS[id];
    const obj = Object.values(KNOWN_OBJECTS).find(item => item.name === id);
    if (obj) return obj;
  }

  public get locked(): boolean { return this._locked; }
  protected set locked(value) {
    if (value !== this._locked) this.dirty = true;
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
    log("Deserializing:", serialized);
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
    this.angle = serialized.angle;
    this.locked = serialized.locked;
    this.zIndex = serialized.zIndex;
    this.alpha = serialized.alpha;
    this.scope = serialized.scope ?? "global";
    this.scopeOwners = serialized.scopeOwners ?? [];
    this.triggers = serialized.triggers ?? {};

    this.x = serialized.bounds.x * this.actualBounds.width;
    this.y = serialized.bounds.y * this.actualBounds.height;
    this.width = serialized.bounds.width * this.actualBounds.width;
    this.height = serialized.bounds.height * this.actualBounds.height;

    this.dirty = false;
  }

  #hookIds: Record<string, number[]> = {};

  public destroy() {
    if (!this.destroyed) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      TweenMax.killTweensOf(this.displayObject);

      delete KNOWN_OBJECTS[this.id];

      if (!this.displayObject.destroyed) this.displayObject.destroy();
      // StageManager.StageObjects.delete(this.id);
      StageManager.removeStageObject(this);
      if (!this.interfaceContainer.destroyed) this.interfaceContainer.destroy();

      const hooks = Object.entries(this.#hookIds);
      for (const [hook, ids] of hooks) {
        for (const id of ids)
          Hooks.off(hook, id);
      }


      delete KNOWN_OBJECTS[this.id];
      // This is a terrible idea, but we are releasing the reference to our Proxy at this point to let things get properly garbage collected
      (this.#displayObject as any) = null;
      // if (this.#revokeProxy) this.#revokeProxy();
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

  private _scope: Scope = "global";
  public get scope() { return this._scope; }
  public set scope(val) {
    if (this.scope !== val) {
      this._scope = val;
      this.dirty = true;
    }
  }

  private _scopeOwners: string[] = [];
  public get scopeOwners() { return this._scopeOwners; }
  public set scopeOwners(val) {
    if (!foundry.utils.objectsEqual({ test: val }, { test: this._scopeOwners })) {
      this._scopeOwners = val;
      this.dirty = true;
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
      locked: this.locked,
      bounds: { ...this.scaledDimensions },
      angle: this.angle,
      restrictToVisualArea: this.restrictToVisualArea,
      scope: this.scope ?? "global",
      scopeOwners: this.scopeOwners ?? [],
      filters: [],
      triggers: this.triggers ?? {},
      triggersEnabled: this.triggersEnabled,
      zIndex: this.zIndex,
      alpha: this.alpha,
      skew: {
        x: this.skew.x,
        y: this.skew.y
      }
    }
  }

  public setLayer(layer: StageLayer) {
    if (this.layer !== layer) {
      this.dirty = true;
      StageManager.setStageObjectLayer(this, layer);
    }
  }

  // #endregion Public Methods (6)

  // #region Protected Methods (7)


  protected onPointerDown(event: PIXI.FederatedMouseEvent) {
    if (game.activeTool === this.selectTool && StageManager.canModifyStageObject(game.user?.id ?? "", this.id)) {
      if (!this.selected && !event.shiftKey)
        StageManager.DeselectAll();

      if (this.selected && event.shiftKey) {
        this.selected = false;
      } else {
        this.selected = true;
      }
      log("StageObject onPointerDown");
      event.stopPropagation();
    }
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
          logError(err);
        })
    } else {
      void closeAllContextMenus()
        .then(() => registerContextMenu(menu))
        .catch((err: Error) => {
          logError(err);
        });
    }
  }

  public get absoluteLeft() { return this.left + this.actualBounds.left; }
  public get absoluteRight() { return this.right + this.actualBounds.left; }
  public get absoluteTop() { return this.top + this.actualBounds.top; }
  public get absoluteBottom() { return this.bottom + this.actualBounds.bottom; }

  protected onHandleDragEnd(e: PIXI.FederatedMouseEvent) {
    e.stopPropagation();
    this.resizing = false;
    this.synchronize = true;
  }

  protected onHandleDragStart(e: PIXI.FederatedMouseEvent) {
    e.stopPropagation();
    // e.preventDefault();
    this.resizing = true;
    this.synchronize = false;
  }

  #pointerEntered = false;

  protected onPointerEnter(e: PIXI.FederatedPointerEvent) {
    if (this.#pointerEntered) return;
    this.#pointerEntered = true;
    if (game.activeTool === this.selectTool && StageManager.canModifyStageObject(game.user?.id ?? "", this.id)) {
      this.highlighted = true;
      e.stopPropagation();
    } else if (!(canvas?.activeLayer instanceof StageManagerControlsLayer)) {
      const { x, y } = this.displayObject.toLocal({ x: e.x, y: e.y });
      void this.triggerEvent("hoverIn", { pos: { x, y, clientX: e.clientX, clientY: e.clientY }, user: game.user as User });
      e.stopPropagation();
    }
  }



  protected onPointerLeave(e: PIXI.FederatedPointerEvent) {
    if (!this.#pointerEntered) return;
    this.#pointerEntered = false;

    if (this.highlighted) this.highlighted = false;
    if (!(canvas?.activeLayer instanceof StageManagerControlsLayer)) {
      const { x, y } = this.displayObject.toLocal({ x: e.x, y: e.y });
      void this.triggerEvent("hoverOut", { pos: { x, y, clientX: e.clientX, clientY: e.clientY }, user: game.user as User });
    }
  }

  protected renderTexture: PIXI.RenderTexture | null = null;

  public getPixelColor(x: number, y: number): PIXI.Color {
    // if (!(canvas?.app?.renderer && this.renderTexture)) throw new CanvasNotInitializedError();
    if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
    const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(this._displayObject, new PIXI.Rectangle(x, y, 1, 1)));

    const color = new PIXI.Color(pixels)
    return color;
  }

  public get layerGroup() {
    switch (this.layer) {
      case "primary":
        return StageManager.primaryCanvasGroup;
      case "foreground":
        return StageManager.foregroundCanvasGroup;
      case "background":
        return StageManager.backgroundCanvasGroup;
      case "text":
        return StageManager.textCanvasGroup;
      case "ui":
        return StageManager.uiCanvasGroup;
    }
  }

  /**
   * Determine if a particular screen points corresponds to a non-transparent pixel of this object
   * @param x 
   * @param y 
   */
  public hitTest(x: number, y: number): boolean {
    // const { x, y } = this.displayObject.toLocal(e);
    const color = this.getPixelColor(x, y);
    return color.alpha > 0;
  }

  public sizeInterfaceContainer() {
    if (this.destroyed) return;
    // Update interface container location
    const bounds = this.displayObject.getBounds();
    if (this.interfaceContainer.visible && this.interfaceContainer.renderable) {
      if (this.resizeHandle) {
        this.resizeHandle.x = bounds.right;
        this.resizeHandle.y = bounds.bottom;
        // this.resizeHandle.x = this.absoluteLeft + this.width;
        // this.resizeHandle.y = this.absoluteTop + this.height;
      }

      const border = this.interfaceContainer.children.find(child => child.name === "border");
      if (border instanceof PIXI.Graphics) {
        border.tint = this.selected ? CONFIG.Canvas.dispositionColors.CONTROLLED : CONFIG.Canvas.dispositionColors.INACTIVE;  //this.highlighted ? CONFIG.Canvas.dispositionColors.INACTIVE : CONFIG.Canvas.dispositionColors.INACTIVE;

        const thickness = CONFIG.Canvas.objectBorderThickness;

        // const bounds = new PIXI.Rectangle(this.left - thickness, this.top - thickness, this.width + thickness * 2, this.height + thickness * 2);
        const newBounds = new PIXI.Rectangle(bounds.left - thickness, bounds.top - thickness, bounds.width + thickness * 2, bounds.height + thickness * 2);

        border.clear();
        border.lineStyle({ width: thickness, color: 0x000000, join: PIXI.LINE_JOIN.ROUND, alignment: 0.75 })
          .drawShape(newBounds);
        border.lineStyle({ width: thickness / 2, color: 0xFFFFFF, join: PIXI.LINE_JOIN.ROUND, alignment: 1 })
          .drawShape(newBounds);
      }
    }
  }
  public readonly abstract type: string;
  // #endregion Protected Methods (7)
}