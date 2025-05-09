import { CannotCopyError, CannotDeserializeError, CanvasNotInitializedError, InvalidStageObjectError } from "../errors";
import { closeAllContextMenus, localize, parsePositionCoordinate, registerContextMenu } from "../functions";
import { ScreenSpaceCanvasGroup } from "../ScreenSpaceCanvasGroup";
import { StageManager } from "../StageManager";
import { Scope, SerializedEffect, SerializedStageObject, SerializedTrigger, StageLayer, TriggerEventSignatures } from '../types';
import { PinHash } from "./PinHash";
import deepProxy from "../lib/deepProxy";
import { StageManagerControlsLayer } from "../ControlButtonsHandler";
import { log, logError, logInfo } from "../logging";
import { getTriggerActionType } from "../triggeractions";
import { deserializeEffect, serializeEffect } from '../lib/effects';
import { CustomFilter } from "../effects/CustomFilter";
import { StageObjectApplication } from "applications";

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

  public readonly tags: string[] = [];

  // protected scaledDimensions = {
  //   x: 0,
  //   y: 0,
  //   width: 0,
  //   height: 0
  // }

  // private _lastSerialize: SerializedStageObject | undefined = undefined;
  private _dirty = false;
  public get dirty() { return this._dirty; }
  public set dirty(val) {
    if (this.dirty !== val) {
      this._dirty = val;
    }
  }

  public static readonly ApplicationType: typeof StageObjectApplication = StageObjectApplication;
  public readonly abstract ApplicationType: typeof StageObjectApplication;



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
  private _synchronize = true;
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


  protected dblClickDelay = 250;

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
      }, this.dblClickDelay);
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
    } else if (game.activeTool === this.selectTool && StageManager.canModifyStageObject(game.user?.id ?? "", this.id)) {
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

  // protected onSynchronize(item: SerializedStageObject) {
  //   if (item.id === this.id) {
  //     this.deserialize(item);
  //     this.dirty = false;
  //   }
  // }

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
      stageObject: this
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

    if (this.triggers[event]) {
      for (const trigger of this.triggers[event]) {
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

  public readonly apps: Record<number, StageObjectApplication> = {};

  constructor(private _displayObject: t, name?: string) {
    if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
    this.#displayObject = this.proxyDisplayObject(_displayObject);
    this.#displayObject.interactive = true;
    this.#displayObject.eventMode = "dynamic";

    this.effects = [];
    // // this.createRenderTexture();
    this.addDisplayObjectListeners();

    this.pin.left = true;
    this.pin.top = true;

    this._name = name ?? this.id;

    // this.addHook(CUSTOM_HOOKS.SYNC_OBJECT, Hooks.on(CUSTOM_HOOKS.SYNC_OBJECT, this.onSynchronize.bind(this)));

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

    this.effects = [];

    KNOWN_OBJECTS[this.id] = this;
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (43)

  /** Object's rotation, in degrees */
  public get angle() { return this.displayObject.angle; }

  public set angle(angle) {
    if (this.displayObject.angle !== angle) {
      this.displayObject.angle = angle;
      this.updateMaskObject();
      this.dirty = true;
    }
  }

  protected updateMaskObject() {
    if (this._maskObj) {
      // this._maskObj.x = this.x;
      // this._maskObj.y = this.y;
      this._maskObj.width = this.width;
      this._maskObj.height = this.height;
      // this._maskObj.angle = this.angle;
    }
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get baseHeight(): number { return 0; }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get baseWidth(): number { return 0; }


  public get left(): number { return this.x - this.actualBounds.left; }
  public set left(val: number | string) {
    const calculated = typeof val === "string" ? this.calculatePercentageExpression(val, this.actualBounds.width) : val;
    if (calculated !== this.left) {
      this.x = calculated + this.actualBounds.left;
    }
  }

  public get right(): number { return this.x - this.actualBounds.left + this.width; }
  public set right(val: number | string) {
    const calculated = typeof val === "string" ? this.calculatePercentageExpression(val, this.actualBounds.width) : val;
    if (calculated !== this.right) {
      this.x = calculated + this.actualBounds.left - this.width;
    }
  }

  public get top(): number { return this.y - this.actualBounds.top; }
  public set top(val: number | string) {
    const calculated = typeof val === "string" ? this.calculatePercentageExpression(val, this.actualBounds.height) : val;
    if (calculated !== this.top) {
      this.y = calculated + this.actualBounds.top;
    }
  }

  public get bottom(): number { return this.y - this.actualBounds.top + this.height; }
  public set bottom(val: number | string) {
    const calculated = typeof val === "string" ? this.calculatePercentageExpression(val, this.actualBounds.height) : val;
    if (calculated !== this.top) {
      this.y = calculated + this.actualBounds.top - this.height;
    }
  }

  public get center() { return new PIXI.Point(this.x + (this.width / 2), this.y + (this.width / 2)); }
  public set center(val) {
    this.x = val.x + this.actualBounds.left - (this.width / 2);
    this.y = val.y + this.actualBounds.top - (this.height / 2);
  }


  public get bounds() { return this.displayObject.getBounds(); }

  public get controlled() { return this.selected; }

  public set controlled(value) { this.selected = value; }

  public get destroyed() { return this.displayObject?.destroyed ?? true; }

  #displayObject: t;

  // #revokeDisplayProxy
  public get displayObject() { return this.#displayObject; }
  protected set displayObject(val) {
    if (this.#displayObject) {
      this.removeDisplayObjectListeners();

      if (val) {
        if (val.transform)
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
        this._displayObject = val;
      }
    }

    if (!val) {
      this.#displayObject = val;
    } else {

      this.#displayObject = this.proxyDisplayObject(val);
      this.#displayObject.name = this.name ?? this.id;
      this.#displayObject.interactive = true;
      this.#displayObject.eventMode = "dynamic";
      if (!Array.isArray(this.#displayObject.filters)) this.#displayObject.filters = [];
      // // this.createRenderTexture();
      this.addDisplayObjectListeners();
    }
  }


  #ignoredProperties = ["worldAlpha", "uvs", "dirty", "indices", "vertexDirty", "transform", "filterArea"];

  protected proxyDisplayObject(val: t): t {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const temp = this;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (val as any).stageObject = this;
    const { proxy } = deepProxy<t>(val, {
      set(target, prop, value) {
        if (typeof prop === "string" && !prop.startsWith("_") && !temp.#ignoredProperties.includes(prop) && temp[prop as keyof typeof temp] !== value) {
          temp.dirty = true;
        }

        return Reflect.set(target, prop, value);
      }
    });
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
      this.updateMaskObject();
      this.updateUniforms();
      // this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get highlighted() { return this._highlighted; }

  public set highlighted(value) {
    if (this._highlighted !== value) {
      this._highlighted = value;
      // this.dirty = true;
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



  // public get owners() { return StageManager.getOwners(this.id).reduce((prev: User[], curr: string) => game?.users?.get(curr) ? [...prev, game.users.get(curr) as User] : prev, [] as User[]); }
  public get owners() { return StageManager.getOwners(this.id).map(id => game.users.get(id) as User); }
  protected set owners(val) {
    if (!foundry.utils.objectsEqual(this.owners, val)) {
      this.dirty = true;
      void StageManager.setOwners(this.id, val.map(item => item.id ?? "").filter(id => !!id));
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
      // if (!this.highlighted) {
      this.interfaceContainer.visible = false;
      this.interfaceContainer.interactiveChildren = false;
      // }

      if (this.resizeHandle) this.resizeHandle.visible = false;
    }
  }

  public get skew() { return this.displayObject.skew; }

  public set skew(skew) { this.displayObject.skew = skew; }

  public get effects(): PIXI.Filter[] {
    if (!Array.isArray(this.displayObject.filters)) this.displayObject.filters = [];
    return this.displayObject.filters;
  }
  public set effects(val) {
    if (!foundry.utils.objectsEqual({ test: val }, { test: this.effects })) {
      this.dirty = true;
      this.displayObject.filters = val;
    }
  }


  public get width() { return 0 }
  public set width(width) {

    if (this.width !== width) {
      this.dirty = true;
      this.updateMaskObject();
      this.updateUniforms();
      // this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  protected calculatePercentageExpression(expression: string, total: number): number {
    const parsedExpression = expression.replace(/\d+(\.\d+)?%/g, perc => `(${perc}) * ${total}`);
    return parsePositionCoordinate(parsedExpression, this);
  }

  protected updatePinLocations() {
    if (this.suppressPinUpdate) return;
    // Pin positions are relative distance from boundary edges

    // Distance from left edge of bounds
    if (this.pin.left) this._leftPinPos = this.left / this.actualBounds.width;
    else this._leftPinPos = -1;

    // Distance from right edge of bounds
    if (this.pin.right) this._rightPinPos = (this.actualBounds.width - this.right) / this.actualBounds.width;
    else this._rightPinPos = -1;

    // Distance from top edge of bounds
    if (this.pin.top) this._topPinPos = this.top / this.actualBounds.height;
    else this._topPinPos = -1;

    // Distance from bottom edge of bounds
    if (this.pin.bottom) this._bottomPinPos = (this.actualBounds.height - this.bottom) / this.actualBounds.height;
    else this._bottomPinPos = -1;
  }

  public get x(): number { return this.displayObject.x; }
  public set x(x: number | string) {
    const calculated = typeof x === "string" ? this.calculatePercentageExpression(x, window.innerWidth) : x;
    if (calculated !== this.x) {
      this.displayObject.x = calculated;
      this.updateMaskObject();
      // this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get y() { return this.displayObject.y; }
  public set y(y) {
    const calculated = typeof y === "string" ? this.calculatePercentageExpression(y, window.innerHeight) : y;
    if (calculated !== this.y) {
      this.displayObject.y = calculated;
      this.updateMaskObject();
      // this.updateScaledDimensions();
      this.updatePinLocations();
    }
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
      {
        name: localize("STAGEMANAGER.MENUS.TOFRONT", {}),
        icon: `<i class="fas fa-sort-up"></i>`,
        condition: StageManager.canModifyStageObject(game.user?.id ?? "", this.id),
        callback: () => { this.bringToFront(); }
      },
      {
        name: localize("STAGEMANAGER.MENUS.TOBACK"),
        icon: `<i class="fas fa-sort-down"></i>`,
        condition: StageManager.canModifyStageObject(game.user?.id ?? "", this.id),
        callback: () => { this.sendToBack(); }
      },
      {
        name: localize("STAGEMANAGER.MENUS.LOCKOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-lock"></i>`,
        callback: (elem: JQuery<HTMLElement>) => {
          log("Locking", this.locked, elem[0]);
          this.locked = true;
        },
        condition: !this.locked
      },
      {
        name: localize("STAGEMANAGER.MENUS.UNLOCKOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-lock-open"></i>`,
        callback: (elem: JQuery<HTMLElement>) => {
          log("Unlocking", this.locked, elem[0]);
          this.locked = false;
        },
        condition: !!this.locked
      },
      {
        name: localize("STAGEMANAGER.MENUS.COPYOBJECT", { name: this.name ?? this.id }),
        icon: `<i class="fas fa-copy"></i>`,
        callback: () => {
          // empty
          StageManager.CopyObjects([this]);
          ui.notifications?.info(localize("CONTROLS.CopiedObjects", {
            count: "1",
            type: localize("STAGEMANAGER.STAGEOBJECT")
          }));
        }
      },
      {
        name: localize("STAGEMANAGER.MENUS.COPYJSON"),
        icon: `<i class="fas fa-code"></i>`,
        callback: () => {
          try {
            if (navigator.clipboard) {
              void navigator.clipboard.writeText(JSON.stringify(this.serialize())).then(() => {
                logInfo(localize("STAGEMANAGER.MENUS.JSONCOPIED", { name: this.name }));
              });
            } else {
              const textArea = document.createElement("textarea");
              textArea.value = JSON.stringify(this.serialize());
              textArea.style.position = "absolute";
              textArea.style.width = "0";
              textArea.style.height = "0";
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand("copy");
              document.body.removeChild(textArea);

              logInfo(localize("STAGEMANAGER.MENUS.JSONCOPIED", { name: this.name }));
            }
          } catch (err) {
            logError(new CannotCopyError((err as Error).message));
          }
        }
      },
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
  public set locked(value) {
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



  public canUserModify(user: User, action: "create" | "update" | "modify" | "delete"): boolean {
    if (typeof user?.id !== "string") return false;
    switch (action) {
      case "create":
        return StageManager.canAddStageObjects(user.id);
      case "update":
      case "modify":
        return StageManager.canModifyStageObject(user.id, this.id);
      case "delete":
        return StageManager.canDeleteStageObject(user.id, this.id);
      default:
        return false;
    }
  }

  // #endregion Protected Getters And Setters (5)

  // #region Public Static Methods (1)

  public static deserialize(serialized: SerializedStageObject): StageObject { throw new CannotDeserializeError(serialized.type) }

  // #endregion Public Static Methods (1)

  // #region Public Methods (6)

  protected updateUniforms() {
    if (Array.isArray(this.effects)) {
      for (const effect of this.effects) {
        if (effect instanceof CustomFilter) {
          effect.setBgScale(this.width, this.height);
        }
      }
    }
  }


  public deserialize(serialized: SerializedStageObject) {


    this.id = serialized.id ?? foundry.utils.randomID();
    this.name = serialized.name ?? this.id;
    // void StageManager.setOwners(this.id, serialized.owners);

    if (typeof serialized.restrictToVisualArea === "boolean") this.restrictToVisualArea = serialized.restrictToVisualArea;

    this.skew.x = serialized.skew?.x ?? 0;
    this.skew.y = serialized.skew?.y ?? 0;

    this.angle = serialized.angle ?? 0;
    this.locked = serialized.locked ?? false;
    this.zIndex = serialized.zIndex ?? 0;
    this.alpha = serialized.alpha ?? 1;
    // this.scope = serialized.scope ?? "global";

    this.temporary = serialized.scope === "temp" ? true : serialized.temporary ?? false;

    this.scopeOwners = serialized.scopeOwners ?? [];
    this.triggers = serialized.triggers ?? {};
    this.clickThrough = serialized.clickThrough ?? false;
    this.visible = serialized.visible ?? true;

    if (typeof serialized.pin !== "undefined") {
      if (typeof serialized.pin.top === "boolean") this.pin.top = serialized.pin.top;
      else this.pin.top = true;

      if (typeof serialized.pin.bottom === "boolean") this.pin.bottom = serialized.pin.bottom;
      else this.pin.bottom = false;

      if (typeof serialized.pin.left === "boolean") this.pin.left = serialized.pin.left;
      else this.pin.left = true;

      if (typeof serialized.pin.right === "boolean") this.pin.right = serialized.pin.right;
      else this.pin.right = false;
    }

    if (Array.isArray(serialized.tags))
      this.tags.splice(0, this.tags.length - 1, ...serialized.tags);

    if (StageManager.canModifyStageObject(game?.user?.id ?? "", this.id)) {
      if (game?.ready) void StageManager.setOwners(this.id, serialized.owners);
      else Hooks.once("canvasReady", () => { void StageManager.setOwners(this.id, serialized.owners) });
    }

    if (typeof serialized.bounds !== "undefined") {
      this.x = serialized.bounds.x * this.actualBounds.width;
      this.y = serialized.bounds.y * this.actualBounds.height;

      this.width = serialized.bounds.width * this.actualBounds.width;
      this.height = serialized.bounds.height * this.actualBounds.height;
    }

    if (serialized.layer)
      this.setLayer(serialized.layer ?? "primary");

    this.effectsEnabled = !!serialized.effectsEnabled;

    if (Array.isArray(this.displayObject.filters)) {
      for (const filter of this.displayObject.filters)
        filter.destroy();
      this.displayObject.filters = [];
    }

    if (Array.isArray(serialized.effects)) {
      for (const effect of serialized.effects) {
        const filter = deserializeEffect(effect);
        if (filter) {
          if (Array.isArray(this.displayObject.filters)) this.displayObject.filters.push(filter);
          else this.displayObject.filters = [filter];
        }
      }
    }

    if (typeof serialized.mask === "string") this.mask = serialized.mask;
    this.dirty = false;
  }

  #hookIds: Record<string, number[]> = {};

  public addEffect(serialized: SerializedEffect): PIXI.Filter | undefined {
    const filter = deserializeEffect(serialized);
    if (filter) {
      if (Array.isArray(this.displayObject.filters)) this.displayObject.filters.push(filter);
      else this.displayObject.filters = [filter];

      this.dirty = true;

      return filter;
    }
  }

  public removeEffect(serialized: SerializedEffect): void
  public removeEffect(id: string): void
  public removeEffect(arg: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const index = this.effects.findIndex(item => typeof arg === "string" ? (item as any).id === arg : (item as any).id === (arg as SerializedEffect).id);
    if (index !== -1) {
      const effect = this.effects[index];
      this.effects.splice(index, 1);
      effect.destroy();
    }
    this.dirty = true;
  }

  public destroy() {
    if (!this.destroyed) {
      const apps = Object.values(this.apps);
      for (const app of apps)
        void app.close({})

      if (this._maskObj && !this._maskObj.destroyed) {
        this.displayObject.mask = null;
        this._maskObj.destroy();
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      gsap.killTweensOf(this.displayObject);

      delete KNOWN_OBJECTS[this.id];

      this.displayObject.parent.removeChild(this.displayObject);
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


  public get actualBounds() { return this.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds; }

  protected suppressPinUpdate = false;

  public scaleToScreen() {
    try {
      this.suppressPinUpdate = true;

      // Calculate and apply a new transform.
      if (this.pin.left && this.pin.right) {
        // Set left
        this.left = this.actualBounds.width * this._leftPinPos;
        // Set width to account for difference
        const right = this.actualBounds.width - (this._rightPinPos * this.actualBounds.width);
        this.width = right - this.left;

      } else if (this.pin.left) {
        this.left = this.actualBounds.width * this._leftPinPos;
      } else if (this.pin.right) {
        this.right = this.actualBounds.width - (this._rightPinPos * this.actualBounds.width);
      }

      if (this.pin.top && this.pin.bottom) {
        // Set top
        this.top = this.actualBounds.height * this._topPinPos;
        // Set height to account for difference.
        const bottom = this.actualBounds.height - (this._bottomPinPos * this.actualBounds.height);
        this.height = bottom - this.top;
      } else if (this.pin.top) {
        this.top = this.actualBounds.height * this._topPinPos;
      } else if (this.pin.bottom) {
        this.bottom = this.actualBounds.height - (this._bottomPinPos * this.actualBounds.height);
      }

      this.sizeInterfaceContainer();
    } catch (err) {
      logError(err as Error);
    } finally {
      this.suppressPinUpdate = false;
    }
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

      if (game.user instanceof User) {
        if (this.canUserModify(game.user, "update"))
          void StageManager.SetScopeOwners(this, val);
      }

      this.dirty = true;
    }
  }

  private _effectsEnabled = true;
  public get effectsEnabled() { return this._effectsEnabled; }
  public set effectsEnabled(enabled) {
    if (enabled !== this.effectsEnabled) {
      this.dirty = true;
      const filters = this.displayObject.filters ?? [];
      for (const filter of filters)
        filter.enabled = enabled;
    }
  }


  private _clickThrough = false;
  public get clickThrough() { return this._clickThrough; }
  public set clickThrough(val) {
    if (val !== this.clickThrough) {
      this._clickThrough = val;

      this.dirty = true;
    }
  }

  protected _maskObj: PIXI.Sprite | undefined = undefined;
  private _mask = "";
  public get mask() { return this._mask; }
  public set mask(val) {
    try {
      if (this.mask !== val) {
        this._mask = val;
        this.dirty = true;

        if (this._maskObj) {
          this.displayObject.mask = null;
          this._maskObj.destroy();
          this._maskObj = undefined;
        }

        if (val) {
          this._maskObj = PIXI.Sprite.from(val);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          if ((this.displayObject as any).addChild) (this.displayObject as any).addChild(this._maskObj);
          this.displayObject.mask = this._maskObj;
          this.updateMaskObject();
        }
      }
    } catch (err) {
      logError(err as Error);
    }
  }

  public macroArguments(): { label: string, value: string, key: string }[] {
    return [
      { key: "stageObject", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.STAGEOBJECT", value: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.AUTO" }
    ];
  }

  private _temporary = false;
  public get temporary() { return this._temporary; }
  public set temporary(val) {
    if (this.temporary !== val) {
      this._temporary = val;
      this.dirty = true;
    }
  }

  public serialize(includeTemporaryEffects = false): SerializedStageObject {
    return {
      id: this.id,
      layer: this.layer as StageLayer ?? "primary",
      owners: StageManager.getOwners(this.id),
      version: __MODULE_VERSION__,
      type: "",
      name: this.name ?? this.id,
      locked: this.locked,
      clickThrough: this.clickThrough,
      visible: this.visible,
      mask: this.mask,
      tags: this.tags,
      temporary: this.temporary,
      pin: {
        top: this.pin.top,
        bottom: this.pin.bottom,
        left: this.pin.left,
        right: this.pin.right
      },
      bounds: {
        x: this.x / this.actualBounds.width,
        y: this.y / this.actualBounds.height,
        width: (this.baseWidth * this.scale.x) / this.actualBounds.width,
        height: (this.baseHeight * this.scale.y) / this.actualBounds.height
      },
      angle: this.angle,
      restrictToVisualArea: this.restrictToVisualArea,
      scope: this.scope ?? "global",
      scopeOwners: this.scopeOwners ?? [],
      effects: (this.effects?.map(effect => serializeEffect(effect)).filter(effect => !!effect && includeTemporaryEffects || !effect?.temporary) ?? []).filter(effect => !!effect),
      effectsEnabled: this.effectsEnabled,
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

    void closeAllContextMenus()
      .then(() => render)
      .then(() => registerContextMenu(menu))
      .then(() => {
        const listener = (e: MouseEvent) => {
          if (!menu.element[0].contains(e.currentTarget as HTMLElement)) {
            void closeAllContextMenus();
            document.removeEventListener("click", listener);
          }
        }
        document.addEventListener("click", listener);
      })

      .catch((err: Error) => {
        logError(err);
      });
  }
  public get visible() { return this.displayObject.renderable; }
  public set visible(val) {
    if (val !== this.displayObject.renderable) {
      this.displayObject.renderable = val;
      this.dirty = true;
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


  protected onPointerEnter(e: PIXI.FederatedPointerEvent) {

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

    // const rt = PIXI.RenderTexture.create({ width: this.baseWidth, height: this.baseHeight });
    // canvas.app.renderer.render(this._displayObject, { renderTexture: rt });
    // const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(rt, new PIXI.Rectangle(x, y, 1, 1)));
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