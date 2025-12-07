import { SynchronizationMessage, SerializedStageObject, DeepPartial } from "types";
import { log, logError } from "logging";
import { SOCKET_MESSAGES } from "SocketManager"
import { HOOKS } from "./hooks";
import { awaitHook } from "functions";

export class SynchronizationManager {

  #knownObjects: Record<string, SerializedStageObject> = {};

  protected MessageReceived(message: SynchronizationMessage) {
    log("Synchronization message received:", message);
  }

  protected async registerSocketHandlers() {
    if (!game?.StageManager?.sockets)
      await awaitHook(HOOKS.SOCKET_INIT as string);

    const sockets = game!.StageManager!.sockets;
    sockets.register(SOCKET_MESSAGES.OBJECT_SYNC, (message: SynchronizationMessage) => { this.MessageReceived(message); });
  }


  protected async registerTickHandler() {
    if (!game?.StageManager) await awaitHook(HOOKS.INITIALIZED as string);

    canvas!.app!.ticker.add(() => { this.onTick(); });
  }

  protected diffObjects(first: SerializedStageObject, second: SerializedStageObject): DeepPartial<SerializedStageObject> {
    return foundry.utils.diffObject(first, second);
  }

  protected onTick() {
    if (!game?.StageManager?.sockets) return;

    const dirty = game.StageManager.stageObjects.dirty.filter(obj => obj.isResponsibleUser);
    const knownIds = Object.keys(this.#knownObjects);
    const added = game.StageManager.stageObjects.filter(obj => obj.isResponsibleUser && !knownIds.includes(obj.id));
    const removed = knownIds.filter(id => !game.StageManager.stageObjects.get(id))

    if (dirty.length || added.length || removed.length) {

      const addedSerialized = added.map(obj => obj.serialize());
      const updatedSerialized = dirty.filter(obj => this.#knownObjects[obj.id]).map(obj => obj.serialize());

      const updatedDiffs = updatedSerialized.map(obj => ({
        ...this.diffObjects(this.#knownObjects[obj.id], obj),
        id: obj.id
      }));

      const message: SynchronizationMessage = {
        removed,
        added: Object.fromEntries(addedSerialized.map(obj => [obj.id, obj])),
        updated: Object.fromEntries(updatedDiffs.filter(obj => Object.keys(obj).length > 1).map(obj => [obj.id, obj]))
      }
      if (Object.keys(message.updated).length || Object.keys(message.added).length || message.removed.length) {

        this.#knownObjects = Object.fromEntries([
          ...addedSerialized.map(obj => [obj.id, obj]),
          ...updatedSerialized.map(obj => [obj.id, obj])
        ]) as Record<string, SerializedStageObject>

        game.StageManager.sockets.executeForEveryone(SOCKET_MESSAGES.OBJECT_SYNC, message)
      }
    }
    dirty.forEach(obj => { obj.dirty = false; });
  }

  constructor() {
    Promise.all([
      this.registerSocketHandlers(),
      this.registerTickHandler()
    ])
      .then(() => { log("Synchronization Manager initialized."); })
      .catch(logError);
  }
}