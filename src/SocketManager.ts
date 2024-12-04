import { StageObject } from "./stageobjects";
import { SerializedStageObject } from "./types";
import { StageManager } from "./StageManager";
import { InvalidStageObjectError, PermissionDeniedError } from "./errors";
import * as stageObjectTypes from "./stageobjects";
import { log } from "./logging";


let socket: any;

export class SocketManager {

  public static syncStageObjects(stageObjects: SerializedStageObject[]) {
    if (!StageManager.canAddStageObjects(game?.user as User)) throw new PermissionDeniedError();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.executeForOthers("syncStageObjects", stageObjects);
  }

  public static addStageObject(stageObject: StageObject) {
    if (!StageManager.canAddStageObjects(game?.user as User)) throw new PermissionDeniedError();
    const objectClass = Object.values(stageObjectTypes).find(item => item.type && stageObject instanceof item);
    if (!objectClass) throw new InvalidStageObjectError(stageObject.constructor.name);

    const serialized = stageObject.serialize();
    log("Serialized:", serialized);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.executeForOthers("addStageObject", serialized);
  }


  public static init() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket = socketlib.registerModule(__MODULE_ID__);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.register("addStageObject", addStageObject);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.register("syncStageObjects", syncStageObjects);
  }
}

function addStageObject(stageObject: SerializedStageObject) {
  StageManager.deserialize(stageObject);
}

function syncStageObjects(data: SerializedStageObject[]) {
  StageManager.Synchronize(data);
}