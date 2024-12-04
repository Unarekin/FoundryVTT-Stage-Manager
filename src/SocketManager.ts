import { StageObject } from "./stageobjects";
import { SerializedStageObject } from "./types";
import { StageManager } from "./StageManager";
import { InvalidStageObjectError, PermissionDeniedError } from "./errors";
import * as stageObjectTypes from "./stageobjects";
import { log } from "./logging";


let socket: any;

export class SocketManager {

  public static addStageObject(stageObject: StageObject) {
    if (!StageManager.canAddStageObjects(game?.user)) throw new PermissionDeniedError();
    const objectClass = Object.values(stageObjectTypes).find(item => item.type && stageObject instanceof item);
    if (!objectClass) throw new InvalidStageObjectError(stageObject.constructor.name);

    const serialized = stageObject.serialize();
    log("Serialized:", serialized);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.executeForOthers("addStageObject",
      {
        id: stageObject.id,
        type: objectClass.type,
        data: serialized,
        layer: stageObject.layer,
        version: __MODULE_VERSION__
      });
  }


  public static init() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket = socketlib.registerModule(__MODULE_ID__);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    socket.register("addStageObject", addStageObject);
  }
}

function addStageObject(stageObject: SerializedStageObject) {
  StageManager.deserialize(stageObject);
}