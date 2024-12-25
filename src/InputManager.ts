import { StageManager } from "./StageManager";
import { InvalidStageObjectError } from "./errors";
import { CanvasNotInitializedError } from './errors/CanvasNotInitializedError';
import { StageObject } from "./stageobjects";

// #region Classes (1)

const DRAG_GHOSTS: Record<string, PIXI.DisplayObject> = {};

export class InputManager {
  // #region Public Static Methods (5)

  /**
   * Handles initializing the InputManager.  Must be called after PIXI stage is initialized.
   */
  public static init() {
    if (!canvas?.stage) throw new CanvasNotInitializedError();

    canvas.stage
      .on("mousemove", InputManager.onPointerMove)
      .on("pointerup", InputManager.onPointerUp)
      .on("pointerupoutside", InputManager.onPointerUp)
      .on("pointerdown", InputManager.onPointerDown)
      ;

    $("#board").on("wheel", onScrollWheel);


    // Funky monkey patching for keydown event, to intercept the escape key and prevent Foundry from handling it on its own
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    libWrapper.register(__MODULE_ID__, "game.keyboard._handleKeyboardEvent", escapeWrapper);
    document.addEventListener("keydown", InputManager.onKeyDown);
  }


  public static onPointerUp(this: void) {
    // Destroy all drag ghosts
    const keys = [...Object.keys(DRAG_GHOSTS)];
    for (const key of keys) {
      DRAG_GHOSTS[key].destroy();
      delete DRAG_GHOSTS[key];
    }


    StageManager.StageObjects.dragging.forEach(item => {
      item.dragging = false;
      item.synchronize = true;
    });

    StageManager.StageObjects.resizing.forEach(item => {
      item.resizing = false;
      item.synchronize = true;
    })
  }

  public static onPointerMove(this: void, event: PIXI.FederatedPointerEvent) {
    const placing = StageManager.StageObjects.placing;
    const selected = StageManager.StageObjects.selected;

    if (placing.length) {
      for (const item of placing) {
        item.x = event.clientX;
        item.y = event.clientY;
      }
    } else if (event.buttons === 1 && selected.length) {
      // We are moving with the left mouse down and have objects selected

      const resizing = StageManager.StageObjects.resizing;
      if (resizing.length) {
        for (const item of resizing) resizeItem(event, item);
      } else if (selected.length) {
        for (const item of selected) {
          if (!item.dragging) {
            // Initiate drag
            item.dragging = true;
            item.synchronize = false;
          }
          if (!DRAG_GHOSTS[item.id])
            DRAG_GHOSTS[item.id] = createDragGhost(item);

          dragItem(event, item);
        }
      }
    }

    // // Left mouse is down
    // if (event.buttons === 1 && StageManager.StageObjects.selected.length) {
    //   // log("Selected:", StageManager.StageObjects.selected);
    //   // log("Dragging:", StageManager.StageObjects.dragging);
    //   // log("Resizing:", StageManager.StageObjects.resizing);

    //   const resizing = StageManager.StageObjects.resizing;
    //   const dragging = StageManager.StageObjects.dragging;
    //   const selected = StageManager.StageObjects.selected;

    //   if (resizing.length) {
    //     for (const item of resizing) resizeItem(event, item);
    //   } else if (dragging.length) {
    //     for (const item of selected) {
    //       item.dragging = true;
    //       dragItem(event, item);
    //     }
    //   }

    //   if (resizing.length)
    //     for (const item of resizing) resizeItem(event, item);
    //   else if (dragging.length)
    //     for (const item of selected) dragItem(event, item);


    //   // const hasDragging = !!StageManager.StageObjects.dragging.length;
    //   // StageManager.StageObjects.selected.forEach(item => {
    //   //   if (item.selected && hasDragging) dragItem(event, item);
    //   //   if (item.resizing) resizeItem(event, item);
    //   // });
    // }
  }

  public static onKeyDown(this: void, e: KeyboardEvent) {
    // The escape key is caught above
    if (e.key === "Delete") {
      const objs = StageManager.StageObjects.filter(obj => obj.selected);
      for (const obj of objs) obj.destroy();
    }
  }

  public static onPointerDown(this: void, e: PIXI.FederatedPointerEvent) {

    // Check for deselection
    const objectsUnderCursor = StageManager.StageObjects.filter(obj => obj.selectTool === game?.activeTool && obj.bounds.contains(e.clientX, e.clientY));
    const resizeHandles = StageManager.StageObjects.filter(obj => obj.selectTool === game?.activeTool && !!obj.resizeHandle?.getBounds().contains(e.clientX, e.clientY));


    if (!resizeHandles.length && !objectsUnderCursor.length) {
      // No objects, no resize handles
      StageManager.DeselectAll();
    } else if (!resizeHandles.length && objectsUnderCursor.some(obj => obj.selected)) {
      // Clicked a selected one, draggin' time
      for (const obj of objectsUnderCursor) {
        if (obj.selected) obj.dragging = true;
      }
    } else if (!resizeHandles.length) {
      const highestObject = objectsUnderCursor.reduce((prev, curr) => curr.zIndex > prev.zIndex ? curr : prev);

      if (!highestObject.selected && !e.shiftKey)
        StageManager.DeselectAll();

      highestObject.selected = true;
    }

    // const interactables = getInteractiveObjectsAtPoint(e.clientX, e.clientY);
    // log("Pointer down:", interactables, StageManager.StageObjects.selected, game?.settings?.get("core", "leftClickRelease"));

    // // Clicked on nothing and some items are selected
    // if (!interactables.length && StageManager.StageObjects.selected.length && game?.settings?.get("core", "leftClickRelease")) {
    //   StageManager.DeselectAll();
    // }

  }

  // #endregion Public Static Methods (5)
}

// #endregion Classes (1)

// #region Functions (3)

function dragItem(event: PIXI.FederatedPointerEvent, item: StageObject) {
  event.preventDefault();
  if (item.placing) {
    item.x = event.screenX;
    item.y = event.screenY;
  } else if (item.dragging) {
    item.x += event.movementX;
    item.y += event.movementY;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function escapeWrapper(wrapped: Function, ...args: unknown[]) {
  if (args[0] instanceof KeyboardEvent) {
    const event = args[0];
    if (event.key === "Escape" && StageManager.SelectedObjects.length)
      StageManager.DeselectAll();
    else
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return wrapped(...args);
  }
}

function resizeItem(event: PIXI.FederatedPointerEvent, item: StageObject) {
  event.preventDefault();
  if (event.ctrlKey) {
    const desiredWidth = event.screenX - item.left;
    const desiredHeight = event.screenY - item.top;
    const ratio = Math.max(desiredWidth / item.baseWidth, desiredHeight / item.baseHeight);
    item.width = item.baseWidth * ratio;
    item.height = item.baseHeight * ratio;
  } else {
    item.width = event.screenX - item.left;
    item.height = event.screenY - item.top;
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
  const newObj = StageManager.deserialize({
    ...stageObject.serialize(),
    id: foundry.utils.randomID()
  });
  if (!newObj) throw new InvalidStageObjectError(undefined);

  stageObject.displayObject.parent.addChild(newObj.displayObject);
  newObj.displayObject.zIndex = stageObject.displayObject.zIndex - 0.5;
  newObj.alpha = 0.5;

  return newObj?.displayObject;
}