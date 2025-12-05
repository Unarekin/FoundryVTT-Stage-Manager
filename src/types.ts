export type IsObject<T> = T extends Readonly<Record<string, any>>
  ? T extends AnyArray | AnyFunction
  ? false
  : true
  : false;

/**
 * Recursively sets keys of an object to optional. Used primarily for update methods
 * @internal
 */
export type DeepPartial<T> = T extends unknown
  ? IsObject<T> extends true
  ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T
  : T;

export type AnyArray = readonly unknown[];
export type AnyFunction = (arg0: never, ...args: never[]) => unknown;


export const StageObjectTypes = [] as const;
export type StageObjectType = typeof StageObjectTypes[number];

export const StageLayers = ["foreground", "background"] as const;
export type StageLayer = typeof StageLayers[number];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializedStageObject {

}

export interface SocketMessage<t extends any[] = []> {
  id: string;
  message: string;
  timestamp: number;
  sender: string;
  users: string[];
  args: t
}

export interface SerializedStageObject {
  id: string;
  name: string;
  type: StageObjectType;
  version: string;
  tags: string[];
  clickThrough: boolean;
  visible: boolean;
  layer: StageLayer;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  skew: {
    x: number,
    y: number
  },
  angle: number;
  locked: boolean;
  mask: string;
  zIndex: number;
  alpha: number;
}

export interface SynchronizationMessage {
  updated: Record<string, DeepPartial<SerializedStageObject>>;
  added: Record<string, SerializedStageObject>;
  removed: string[];
}