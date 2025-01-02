/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { SynchronizationMessage } from "./types";
import { StageManager } from "./StageManager";
import { PermissionDeniedError } from "./errors";
import { CUSTOM_HOOKS } from "./hooks";


let socket: any;

export class SocketManager {

  public static async sendSynchronizationMessage(message: SynchronizationMessage) {
    // log("Sending synchronization message:", message);
    const userId = game?.user?.id ?? "";
    if (!userId) throw new PermissionDeniedError();
    // Make sure we aren't trying to add/remove/modify stage objects we cannot
    if (message.added.length && !StageManager.canAddStageObjects(userId)) throw new PermissionDeniedError();
    for (const item of message.removed) if (!StageManager.canDeleteStageObject(userId, item)) throw new PermissionDeniedError();
    for (const item of message.updated) if (!StageManager.canModifyStageObject(userId, item.id)) throw new PermissionDeniedError();

    await socket.executeForOthers("syncStageObjects", message);
  }

  // public static async syncStageObjects(stageObjects: SerializedStageObject[]) {
  //   if (!StageManager.canAddStageObjects(game?.user?.id ?? "")) throw new PermissionDeniedError();
  //   // log("Synchronizing:", stageObjects);
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  //   await socket.executeForOthers("syncStageObjects", stageObjects);
  // }

  public static onSynchronizationMessageReceived(this: void, message: SynchronizationMessage) {
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
  }
}
