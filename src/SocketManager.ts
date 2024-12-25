import { StageObject } from "./stageobjects";
import { SerializedStageObject } from "./types";
import { StageManager } from "./StageManager";
import { CannotDeserializeError, InvalidStageObjectError, PermissionDeniedError } from "./errors";
import * as stageObjectTypes from "./stageobjects";


let socket: any;

export class SocketManager {

  public static syncStageObjects(stageObjects: SerializedStageObject[]) {
    if (!StageManager.canAddStageObjects(game?.user?.id ?? "")) throw new PermissionDeniedError();
    // const start = performance.now();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    void socket.executeForOthers("syncStageObjects", stageObjects);
  }

  public static addStageObject(stageObject: StageObject) {
    if (!StageManager.canAddStageObjects(game?.user?.id ?? "")) throw new PermissionDeniedError();
    const objectClass = Object.values(stageObjectTypes).find(item => item.type && stageObject instanceof item);
    if (!objectClass) throw new InvalidStageObjectError(stageObject.constructor.name);

    const serialized = stageObject.serialize();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.executeForOthers("addStageObject", serialized);
  }

  public static removeStageObject(stageObject: StageObject) {
    if (!StageManager.canDeleteStageObject(game?.user?.id ?? "", stageObject.id)) throw new PermissionDeniedError();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.executeForOthers("removeStageObject", stageObject.id);
  }


  public static init() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket = socketlib.registerModule(__MODULE_ID__);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.register("addStageObject", addStageObject);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.register("syncStageObjects", syncStageObjects);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.register("removeStageObject", removeStageObject);
  }
}

function addStageObject(stageObject: SerializedStageObject) {
  const obj = StageManager.deserialize(stageObject);
  if (!obj) throw new CannotDeserializeError(stageObject);
  StageManager.addStageObject(obj);
}

function syncStageObjects(data: SerializedStageObject[]) {
  StageManager.Synchronize(data);
}

function removeStageObject(id: string) {
  const obj = StageManager.StageObjects.get(id);
  if (obj) StageManager.removeStageObject(obj);
}