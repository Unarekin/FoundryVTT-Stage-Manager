import { StageObject } from "stageobjects";
import { CUSTOM_HOOKS } from "./hooks";
import { SerializedStageObject, SynchronizationMessage } from './types';
import { StageManager } from "StageManager";
import { SocketManager } from "SocketManager";
import { logError } from "logging";

let OBJECTS_ADDED: string[] = [];
let OBJECTS_REMOVED: string[] = [];

let IS_SYNCHRONIZING = false;

export class SynchronizationManager {

  public static get isSynchronizing() { return IS_SYNCHRONIZING; }


  /**
   * Handles synchronization logic
   */
  public static async Synchronize(this: void) {
    try {

      // Only synchronize if not already sending a synchronization message
      // if (SynchronizationManager.isSynchronizing) return;
      IS_SYNCHRONIZING = true;

      const message: SynchronizationMessage = {
        timestamp: Date.now(),
        removed: OBJECTS_REMOVED.filter(id => {
          const obj = StageManager.StageObjects.get(id);
          if (!(obj instanceof StageObject)) return false;
          else if (!(game.user instanceof User) || !obj.canUserModify(game.user, "delete")) return false;
          return obj.synchronize;
        }),
        added: OBJECTS_ADDED.reduce((prev, curr) => {
          const obj = StageManager.StageObjects.get(curr);
          if (!(obj instanceof StageObject) || !obj.synchronize) return prev;
          else if (!(game.user instanceof User) || !obj.canUserModify(game.user, "create")) return prev;
          else return [...prev, obj.serialize()];
        }, [] as SerializedStageObject[]),
        updated: StageManager.StageObjects.dirty.reduce((prev, curr) => {
          if (OBJECTS_ADDED.includes(curr.id) || OBJECTS_REMOVED.includes(curr.id) || !curr.synchronize) return prev;
          else if (!(game.user instanceof User) || !curr.canUserModify(game.user, "update")) return prev;
          else return [...prev, curr.serialize()];
        }, [] as SerializedStageObject[])
      }




      if (message.added.length || message.removed.length || message.updated.length) {
        // Remove from buffers
        if (message.added.length) OBJECTS_ADDED = OBJECTS_ADDED.filter(id => !message.added.find(obj => obj.id === id));
        if (message.removed.length) OBJECTS_REMOVED = OBJECTS_REMOVED.filter(id => !message.removed.includes(id));
        if (message.updated.length) StageManager.StageObjects.dirty.forEach(obj => { obj.dirty = false; });


        Hooks.callAll(CUSTOM_HOOKS.SYNC_START, message);
        await SocketManager.sendSynchronizationMessage(message);
        Hooks.callAll(CUSTOM_HOOKS.SYNC_END, message);
      }

    } catch (err) {
      logError(err as Error);
    } finally {
      IS_SYNCHRONIZING = false;
    }


  }


  public static init() {
    // Set up a ticker to handle our synchronization call
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      void SynchronizationManager.Synchronize();
    });
    ticker.start();

    Hooks.on(CUSTOM_HOOKS.OBJECT_ADDED, (obj: StageObject) => {
      OBJECTS_ADDED.push(obj.id);
    });

    Hooks.on(CUSTOM_HOOKS.OBJECT_REMOVED, (obj: StageObject) => {
      OBJECTS_REMOVED.push(obj.id);
    });
  }

}


