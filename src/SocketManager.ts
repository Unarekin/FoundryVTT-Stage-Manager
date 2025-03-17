/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { SynchronizationMessage } from "./types";
import { StageManager } from "./StageManager";
import { CanvasNotInitializedError, InvalidUserError, PermissionDeniedError } from "./errors";
import { CUSTOM_HOOKS } from "./hooks";
import { setUserObjects } from "./Settings";
import { log, logError } from "logging";


let socket: any;

export class SocketManager {

  public static async sendSynchronizationMessage(message: SynchronizationMessage) {
    try {
      // log("Sending synchronization message:", message);
      if (!game?.user || !game?.users) throw new CanvasNotInitializedError();
      const userId = game?.user?.id ?? "";
      if (!userId) throw new PermissionDeniedError();
      await socket.executeForOthers("syncStageObjects", message);
    } catch (err) {
      logError(err as Error);
    }
  }


  private static async onPersistUserObjects(this: void) {
    const user = game.user;
    if (!(user instanceof User)) throw new InvalidUserError(user);
    const objects = StageManager.StageObjects.contents.filter(item => item.scope === "user" && (item.scopeOwners.includes(user.id) || item.scopeOwners.includes(user.uuid)));
    // log("Persisting user objects:", user.name, objects.map(obj => obj.serialize()));
    await setUserObjects(user, objects);
  }

  public static async persistUserObjects(id: string) {
    await socket.executeAsUser("persistUserObjects", id);
  }


  public static onSynchronizationMessageReceived(this: void, message: SynchronizationMessage) {
    log("Synchronization message received:", message);
    Hooks.callAll(CUSTOM_HOOKS.SYNC_START, message);
    for (const item of message.added) Hooks.callAll(CUSTOM_HOOKS.REMOTE_ADDED, item);
    for (const id of message.removed) Hooks.callAll(CUSTOM_HOOKS.REMOTE_REMOVED, id);
    for (const item of message.updated) Hooks.callAll(CUSTOM_HOOKS.SYNC_OBJECT, item);
    Hooks.callAll(CUSTOM_HOOKS.SYNC_END, message);
  }

  public static init() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    socket = socketlib.registerModule(__MODULE_ID__);
    socket.register("syncStageObjects", SocketManager.onSynchronizationMessageReceived);
    socket.register("persistUserObjects", SocketManager.onPersistUserObjects);
  }
}
