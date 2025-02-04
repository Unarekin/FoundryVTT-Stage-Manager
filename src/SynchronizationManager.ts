import { SocketManager } from './SocketManager';
import { StageManager } from './StageManager';
import { SerializedStageObject } from './types';
import { CUSTOM_HOOKS } from "./hooks";
import { CanvasNotInitializedError, InvalidStageObjectError } from './errors';
import { coerceStageObject } from './coercion';
import { SynchronizationMessage } from "./types";
import { StageObject } from './stageobjects';
import { logError } from './logging';

let isSynchronizing = false;

const ADDITIONS: StageObject[] = [];
const REMOVALS: StageObject[] = [];

/**
 * A class to handle the synchronization of {@link StageObject}s between connected clients.
 */
export class SynchronizationManager {
  public static get isSynchronizing() { return isSynchronizing; }

  public static SuppressSynchronization = false;

  public static SynchronizationReceived(objects: SerializedStageObject[]) {
    // Many updates, left side.  Handle it.
    for (const serialized of objects) {
      const obj = coerceStageObject(serialized);
      if (!obj) {
        const err = new InvalidStageObjectError(obj);
        logError(err);
      } else {
        Hooks.callAll(CUSTOM_HOOKS.SYNC_OBJECT, serialized, obj);
        obj.deserialize(serialized);
      }
    }
  }

  public static onObjectAdded(this: void, stageObject: StageObject) {
    if (!SynchronizationManager.SuppressSynchronization)
      ADDITIONS.push(stageObject);
  }

  public static onObjectRemoved(this: void, stageObject: StageObject) {
    if (!SynchronizationManager.SuppressSynchronization)
      REMOVALS.push(stageObject);
  }


  public static async Synchronize(this: void) {
    if (SynchronizationManager.SuppressSynchronization) return;
    // Early exit to avoid clogging the pipes
    if (SynchronizationManager.isSynchronizing) return;

    isSynchronizing = true;

    const userId = game?.user?.id ?? "";

    const message: SynchronizationMessage = {
      timestamp: Date.now(),
      updated: StageManager.StageObjects.dirty.reduce((prev, curr) => {
        if (!StageManager.canModifyStageObject(userId, curr.id)) return prev;
        if (!curr.synchronize) return prev;
        return [...prev, curr.serialize()];
      }, [] as SerializedStageObject[]),
      added: ADDITIONS.reduce((prev, curr, i, arr) => {
        // Serialize, and remove duplicates
        // Reversed to keep the most recent element
        const index = arr.reverse().findIndex(item => item.id === curr.id);
        if (index !== i) return prev;
        if (!StageManager.canAddStageObjects(userId)) return prev;
        return [...prev, curr.serialize()];
      }, [] as SerializedStageObject[]),
      removed: REMOVALS.reduce((prev, curr) => {
        // Serialize, and remove duplicates
        // Reverse to keep the most recent elements
        if (prev.includes(curr.id)) return prev;
        if (!StageManager.canDeleteStageObject(userId, curr.id)) return prev;
        return [...prev, curr.id]
      }, [] as string[])
    };

    // Remove from temporary buffers
    ADDITIONS.splice(0, ADDITIONS.length);
    REMOVALS.splice(0, REMOVALS.length);

    if (message.updated.length || message.added.length || message.removed.length) {
      Hooks.callAll(CUSTOM_HOOKS.SYNC_START, message);
      await SocketManager.sendSynchronizationMessage(message);
      Hooks.callAll(CUSTOM_HOOKS.SYNC_END, message);
    }

    message.updated.forEach(item => {
      const obj = coerceStageObject(item.id);
      if (obj) obj.dirty = false;
    });

    isSynchronizing = false;
  }


  // public static readonly Ticker = new PIXI.Ticker();


  public static init() {
    // Empty
    if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
    if (ticker) ticker.destroy();
    ticker = new PIXI.Ticker()
    ticker.add(SynchronizationManager.Synchronize);
    ticker.start();

    // canvas.app.renderer.addListener("postrender", () => { void SynchronizationManager.Synchronize(); });

    // this.Ticker.add(() => { void SynchronizationManager.Synchronize(); });
    // this.Ticker.start();
    Hooks.on(CUSTOM_HOOKS.OBJECT_ADDED, SynchronizationManager.onObjectAdded);
    Hooks.on(CUSTOM_HOOKS.OBJECT_REMOVED, SynchronizationManager.onObjectRemoved);

  }
}

let ticker: PIXI.Ticker | null = null;