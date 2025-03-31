import { StageManager } from "./StageManager";
import { CanvasNotInitializedError } from './errors/CanvasNotInitializedError';
import { StageObject } from "./stageobjects";
import { TOOLS } from "./ControlButtonsHandler";
import { StageLayer } from "./types";
import { InputHandlers } from "./input";

// #region Classes (1)

let POINTER_DOWN = false;

const DRAG_GHOSTS: Record<string, PIXI.DisplayObject> = {};
const PLACING_GHOSTS: PIXI.DisplayObject[] = [];

export class InputManager {
  // #region Public Static Methods (5)

  public static setCanvasEvents() {
    if (!canvas?.stage) throw new CanvasNotInitializedError();

    canvas.stage
      .on("mousemove", InputManager.onPointerMove)
      .on("pointerup", InputManager.onPointerUp)
      .on("pointerupoutside", InputManager.onPointerUp)
      .on("pointerdown", InputManager.onPointerDown)
      ;
  }

  /**
   * Handles initializing the InputManager.  Must be called after PIXI stage is initialized.
   */
  public static init() {
    if (!canvas?.stage) throw new CanvasNotInitializedError();


    InputManager.setCanvasEvents();

    Hooks.on("canvasReady", () => { InputManager.setCanvasEvents(); });

    $("#board")
      .on("wheel", onScrollWheel)
      .on("mousedown", () => { POINTER_DOWN = true; })
      .on("mouseup", () => { POINTER_DOWN = false; })
      ;


    // Funky monkey patching for keydown event, to intercept the escape key and prevent Foundry from handling it on its own
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    libWrapper.register(__MODULE_ID__, "game.keyboard._handleKeyboardEvent", keyEventWrapper);
    // document.addEventListener("keydown", InputManager.onKeyDown);
  }


  public static onPointerUp(this: void, event: PIXI.FederatedPointerEvent) {
    // Destroy all drag ghosts
    const keys = [...Object.keys(DRAG_GHOSTS)];
    for (const key of keys) {
      try {
        DRAG_GHOSTS[key].destroy();
        delete DRAG_GHOSTS[key];
      } catch {
        // empty
      }
    }

    if (rectangleSelect)
      stopRectangleSelect(event);

    StageManager.StageObjects.dragging.forEach(item => {
      item.dragging = false;
      item.synchronize = true;
    });

    StageManager.StageObjects.resizing.forEach(item => {
      item.resizing = false;
      item.synchronize = true;
    });

  }

  public static async PlaceDisplayObject(obj: PIXI.DisplayObject, layer: StageLayer): Promise<PIXI.DisplayObject> {

    return new Promise<PIXI.DisplayObject>((resolve, reject) => {
      try {
        if (!canvas?.stage) throw new CanvasNotInitializedError();
        const group = StageManager.getCanvasGroup(layer);
        if (!group) throw new CanvasNotInitializedError();

        group.addChild(obj);
        PLACING_GHOSTS.push(obj);
        canvas.stage.once("pointerdown", e => {
          obj.x = e.clientX;
          obj.y = e.clientY;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if ((obj as any).width)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            obj.x -= ((obj as any).width / 2);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if ((obj as any).height)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            obj.y -= (obj as any).height / 2;

          // Remove from array
          const index = PLACING_GHOSTS.indexOf(obj);
          if (index !== -1) PLACING_GHOSTS.splice(index, 1);

          resolve(obj);
        });
      } catch (err) {
        reject(err as Error);
      }
    });
  }

  public static onPointerMove(this: void, event: PIXI.FederatedPointerEvent) {
    const selected = StageManager.StageObjects.selected;
    // log("Pointer move:", event, selected);

    if (event.buttons === 1 && selected.length && POINTER_DOWN) {
      // We are moving with the left mouse down and have objects selected

      const resizing = StageManager.StageObjects.resizing;
      if (resizing.length) {
        for (const item of resizing) resizeItem(event, item);
      } else if (selected.length) {
        // log("Dragging:", selected);
        for (const item of selected) {
          if (item.destroyed) continue;
          if (!item.dragging) {
            // Initiate drag
            item.dragging = true;
            item.synchronize = false;
          }
          if (!DRAG_GHOSTS[item.id]) {
            DRAG_GHOSTS[item.id] = createDragGhost(item);
          }


          dragItem(event, item);
        }
      }
    } else if (event.buttons === 1 && !selected.length && POINTER_DOWN) {
      // Rectangle select time baby
      if (rectangleSelect) {
        // Update dimensions
        const thickness = CONFIG.Canvas.objectBorderThickness;
        const bounds = new PIXI.Rectangle(Math.min(rectangleSelectStart.x, event.clientX), Math.min(rectangleSelectStart.y, event.clientY), Math.abs(rectangleSelectStart.x - event.clientX), Math.abs(rectangleSelectStart.y - event.clientY));
        rectangleSelect.clear();
        rectangleSelect.lineStyle({ width: thickness, color: 0x000000, join: PIXI.LINE_JOIN.ROUND, alignment: 0.75 })
          .drawShape(bounds);
        rectangleSelect.lineStyle({ width: thickness / 2, color: 0xFFFFFF, join: PIXI.LINE_JOIN.ROUND, alignment: 1 })
          .drawShape(bounds);

        const highlight = StageManager.StageObjects.within(bounds).filter(item => item.selectTool === game.activeTool)
        const highlighted = StageManager.StageObjects.highlighted;
        for (const item of highlighted) {
          if (!highlight.includes(item)) item.highlighted = false;
        }

        for (const item of highlight) {
          if (!item.highlighted) item.highlighted = true;
        }

      } else if (TOOLS.includes(game.activeTool ?? "") && POINTER_DOWN) {
        startRectangleSelect(event);
      }
    } else if (event.buttons === 0 && PLACING_GHOSTS.length) {
      PLACING_GHOSTS.forEach(item => {
        item.x = event.clientX;
        item.y = event.clientY;
      });
    }
  }

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // public static onKeyDown(this: void, e: KeyboardEvent) {
  //   if (!game.keyboard) return;

  //   // The escape key is caught above

  //   log("Stuff:", game.keyboard.isCoreActionKeyActive("delete"))



  //   if (game.keyboard.isCoreActionKeyActive("delete")) {
  //     const objs = StageManager.StageObjects.filter(obj => obj.selected);
  //     for (const obj of objs) obj.destroy();  
  //   }
  // }

  public static onPointerDown(this: void, e: PIXI.FederatedPointerEvent) {
    // log("Pointer down:", e);
    const resizeHandles = StageManager.StageObjects.filter(obj => obj.selectTool === game?.activeTool && !!obj.resizeHandle?.getBounds().contains(e.clientX, e.clientY));
    if (!resizeHandles.length && game.settings?.get("core", "leftClickRelease"))
      StageManager.DeselectAll();
  }

  // #endregion Public Static Methods (5)
}

// #endregion Classes (1)

// #region Functions (3)

function dragItem(event: PIXI.FederatedPointerEvent, item: StageObject) {
  event.preventDefault();
  item.x += event.movementX;
  item.y += event.movementY;
  // if (item.placing) {
  //   item.x = event.screenX;
  //   item.y = event.screenY;
  // } else if (item.dragging) {
  //   item.x += event.movementX;
  //   item.y += event.movementY;
  // }
}


// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
async function keyEventWrapper(wrapped: Function, ...args: unknown[]) {
  if (!game.keyboard?.hasFocus && args[0] instanceof KeyboardEvent) {
    const event = args[0];

    const context = KeyboardManager.getKeyboardEventContext(event, (args[1] as boolean) ?? false);

    // if (!context.up) {
      const actions = KeyboardManager._getMatchingActions(context);
      
      for (const action of actions) {
        if (InputHandlers[action.action]) {
          const handled = await InputHandlers[action.action](context);
          if (handled) {
            context.event?.preventDefault();
            context.event?.stopPropagation();
            return;
          }
        }
      }

    // }
  }
  // Pass to original
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return wrapped(...args);
}

function resizeItem(event: PIXI.FederatedPointerEvent, item: StageObject) {
  event.preventDefault();
  if (event.ctrlKey) {
    const desiredWidth = event.clientX - item.left;
    const desiredHeight = event.clientY - item.top;
    const ratio = Math.max(desiredWidth / item.baseWidth, desiredHeight / item.baseHeight);
    item.width = item.baseWidth * ratio;
    item.height = item.baseHeight * ratio;
  } else {
    item.width = event.clientX - item.left;
    item.height = event.clientY - item.top;
  }
}


function onScrollWheel(e: JQuery.TriggeredEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) {
  if (!(e.ctrlKey || e.shiftKey)) return;
  const event = e.originalEvent as WheelEvent;
  if (!event.deltaY) return;

  const selected = StageManager.SelectedObjects.filter(obj => game.activeTool === obj.selectTool);
  if (!selected.length) return;

  for (const obj of selected) {
    if (e.shiftKey) {
      obj.angle += event.deltaY > 0 ? 45 : -45;
    } else if (e.ctrlKey) {
      obj.angle += event.deltaY > 0 ? 15 : -15;
    }
    obj.normalizeRotation();
  }
  return false;
}

// #endregion Functions (3)

function createDragGhost(stageObject: StageObject): PIXI.DisplayObject {
  const newObj = stageObject.createDragGhost();
  stageObject.displayObject.parent.addChild(newObj);
  newObj.alpha = 0.5;
  newObj.zIndex = stageObject.zIndex - 0.5;
  newObj.x = stageObject.x;
  newObj.y = stageObject.y;
  return newObj;
}

let rectangleSelect: PIXI.Graphics | null = null;
const rectangleSelectStart = { x: -1, y: -1 };

function startRectangleSelect(event: PIXI.FederatedPointerEvent) {
  if (rectangleSelect) rectangleSelect.destroy();
  rectangleSelect = new PIXI.Graphics();
  rectangleSelect.eventMode = "none";
  rectangleSelect.name = "rectangleSelect";
  StageManager.uiCanvasGroup.addChild(rectangleSelect);

  rectangleSelect.tint = CONFIG.Canvas.dispositionColors.CONTROLLED;
  rectangleSelectStart.x = event.clientX;
  rectangleSelectStart.y = event.clientY;
}

function stopRectangleSelect(event: PIXI.FederatedPointerEvent) {
  if (!rectangleSelect) return;
  const bounds = new PIXI.Rectangle(Math.min(rectangleSelectStart.x, event.clientX), Math.min(rectangleSelectStart.y, event.clientY), Math.abs(rectangleSelectStart.x - event.clientX), Math.abs(rectangleSelectStart.y - event.clientY));
  StageManager.DeselectAll();
  const within = StageManager.StageObjects.within(bounds).filter(item => item.selectTool === game.activeTool);
  for (const item of within) {
    if (StageManager.canModifyStageObject(game.user?.id ?? "", item.id))
      item.selected = true;
    item.highlighted = false;

  }
  rectangleSelect.destroy();
  rectangleSelect = null;
}