import { StageObject } from "./stageobjects";

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
  triggersEnabled: boolean;
  triggers: Partial<Record<keyof TriggerEventSignatures, SerializedTrigger[]>>;
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

export interface SerializedActorStageObject extends SerializedImageStageObject {
  actor: string;
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

export type StageObjectLike = string | StageObject | PIXI.DisplayObject;

export interface ActorSettings {
  name: string;
  image: string;
}



export interface TriggerEventSignatures {
  hoverIn: { pos: { x: number, y: number, clientX: number; clientY: number } };
  hoverOut: { pos: { x: number, y: number, clientX: number; clientY: number } };
  click: { pos: { x: number, y: number, clientX: number; clientY: number }, modKeys: { ctrl: boolean, shift: boolean, alt: boolean } };
  doubleClick: { pos: { x: number, y: number, clientX: number; clientY: number }, modKeys: { ctrl: boolean, shift: boolean, alt: boolean } };
  rightClick: { pos: { x: number, y: number, clientX: number; clientY: number }, modKeys: { ctrl: boolean, shift: boolean, alt: boolean } };
  combatStart: { combat: Combat };
  combatEnd: { combat: Combat };
  combatRound: { combat: Combat };
  combatTurnStart: { combat: Combat, actor: Actor };
  combatTurnEnd: { combat: Combat, actor: Actor };
  sceneChange: { scene: Scene };
  pause: undefined;
  unpause: undefined;
  userConnected: { user: User };
  userDisconnected: { user: User };
  addActiveEffect: { actor: Actor, effect: ActiveEffect };
  removeActiveEffect: { actor: Actor, effect: ActiveEffect };
  addStatusEffect: { actor: Actor, effect: ActiveEffect, status: string };
  removeStatusEffect: { actor: Actor, effect: ActiveEffect, status: string };
  selectToken: { token: Token, actor: Actor };
  deselectToken: { token: Token, actor: Actor };
  targetToken: { user: User, token: Token, actor: Actor };
  untargetToken: { user: User, token: Token, actor: Actor };
  worldTimeChange: { time: number };
  actorChanged: { actor: Actor };
}


// export type TriggerEvent = typeof TriggerEvents[number];

export interface SerializedTrigger {
  id: string;
  label: string;
  type: string;
}

export interface SerializedMacroTrigger extends SerializedTrigger {
  macro: string;
  arguments: { name: string, value: any }[]
}