// export type StageLayer = "primary" | "foreground" | "background" | "text" | "ui";
export const StageLayers = ["primary", "foreground", "background", "text", "ui"] as const;
export type StageLayer = typeof StageLayers[number];

export const Scopes = ["scene", "global", "user", "temp"] as const;
export type Scope = typeof Scopes[number];


export interface SerializedStageObject {
  type: string;
  id: string;
  owners: string[],
  version: string;
  layer: StageLayer;
  name: string;
  scope: Scope;
  scopeOwners: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  skew: { x: number, y: number };
  angle: number;
  locked: boolean;
  filters: SerializedFilter[];
  restrictToVisualArea: boolean;
  zIndex: number;
  alpha: number;
}

export interface SerializedImageStageObject extends SerializedStageObject {
  src: string;
  // playing: boolean;
  loop: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializedFilter { }

export interface SynchronizationMessage {
  timestamp: number;
  added: SerializedStageObject[];
  updated: SerializedStageObject[];
  removed: string[];
}

export type PartialWithRequired<t, k extends keyof t> = Partial<t> & Pick<Required<t>, k>;

export const TOOL_LAYERS: Record<string, StageLayer> = {
  "sm-select-primary": "primary",
  "sm-select-foreground": "foreground",
  "sm-select-background": "background",
  "sm-select-text": "text"
}
