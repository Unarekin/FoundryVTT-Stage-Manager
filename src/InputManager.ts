import { StageManager } from "./StageManager";
import { CanvasNotInitializedError } from './errors/CanvasNotInitializedError';
import { StageObject } from "./stageobjects";

// #region Classes (1)

export class InputManager {
  // #region Public Static Methods (5)

  /**
   * Handles initializing the InputManager.  Must be called after PIXI stage is initialized.
   */
  public static init() {
    if (!canvas?.stage) throw new CanvasNotInitializedError();

    canvas.stage
      .on("mousemove", InputManager.onDragMove)
      .on("pointerup", InputManager.onDragEnd)
      .on("pointerupoutside", InputManager.onDragEnd)
      .on("pointerdown", InputManager.onPointerDown)
      ;

    // Funky monkey patching for keydown event, to intercept the escape key and prevent Foundry from handling it on its own
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    libWrapper.register(__MODULE_ID__, "game.keyboard._handleKeyboardEvent", escapeWrapper);
    document.addEventListener("keydown", InputManager.onKeyDown);
  }

  public static onDragEnd(this: void) {
    StageManager.StageObjects.forEach(item => {
      if (item.dragging) {
        item.dragging = false;
        item.synchronize = true;
      }

      if (item.resizing) {
        item.resizing = false;
        item.synchronize = true;
      }
    })
  }

  public static onDragMove(this: void, event: PIXI.FederatedPointerEvent) {
    StageManager.StageObjects.forEach(item => {
      if (item.dragging || item.placing) dragItem(event, item);
      if (item.resizing) resizeItem(event, item);
    })
  }

  public static onKeyDown(this: void, e: KeyboardEvent) {
    // The escape key is caught above
    if (e.key === "Delete") {
      const objs = StageManager.StageObjects.filter(obj => obj.selected);
      for (const obj of objs) obj.destroy();
    }
  }

  public static onPointerDown(this: void, e: PIXI.FederatedPointerEvent) {
    if (game?.settings?.get("core", "leftClickRelease")) {
      StageManager.SelectedObjects.forEach(obj => {
        if (!obj.interfaceContainer.getBounds().contains(e.clientX, e.clientY)) obj.selected = false;
      });
    }
  }

  // #endregion Public Static Methods (5)
}

// #endregion Classes (1)

// #region Functions (3)

function dragItem(event: PIXI.FederatedPointerEvent, item: StageObject) {
  event.preventDefault();
  item.x = event.screenX;
  item.y = event.screenY;
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

// #endregion Functions (3)
