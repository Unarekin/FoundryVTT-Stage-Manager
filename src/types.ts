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
  clickThrough: boolean;
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
  effects: SerializedEffect[];
  effectsEnabled: boolean;
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

export interface SerializedTextStageObject extends SerializedStageObject {
  text: string;
  style: Record<string, unknown>;
}

export interface SerializedPanelStageObject extends SerializedStageObject {
  borders: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }
  src: string;
}

export interface SerializedDialogStageObject extends SerializedStageObject {
  portrait: SerializedImageStageObject;
  panel: SerializedPanelStageObject;
  text: SerializedTextStageObject;

  showPortrait: boolean;
}

/*
export const StageLayers = ["primary", "foreground", "background", "text", "ui"] as const;
export type StageLayer = typeof StageLayers[number];
*/

export const EffectTypes = ["outline", "dropshadow", "blur", "pixelate", "glow", "bevel"] as const;
export type EffectType = typeof EffectTypes[number];

export interface SerializedEffect {
  id: string;
  type: EffectType;
  version: string;
}

export interface SerializedOutlineEffect extends SerializedEffect {
  color: string;
  outlineOnly: boolean;
  thickness: number;
  quality: number;
}

export interface SerializedDropShadowEffect extends SerializedEffect {
  type: "dropshadow";
  offsetX: number;
  offsetY: number;
  color: string;
  blur: number;
  quality: number;
}

export interface SerializedBlurEffect extends SerializedEffect {
  type: "blur",
  strength: number;
  quality: number;
}


export interface SerializedPixelateEffect extends SerializedEffect {
  size: number;
}

export interface SerializedGlowEffect extends SerializedEffect {
  color: string;
  quality: number;
  innerStrength: number;
  outerStrength: number;
  glowOnly: boolean;
}

export interface SerializedBevelEffect extends SerializedEffect {
  type: "bevel",
  rotation: number;
  thickness: number;
  lightColor: string;
  shadowColor: string;
}

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
  hoverIn: { pos: { x: number, y: number, clientX: number; clientY: number }, user: User; };
  hoverOut: { pos: { x: number, y: number, clientX: number; clientY: number }, user: User };
  click: { pos: { x: number, y: number, clientX: number; clientY: number }, modKeys: { ctrl: boolean, shift: boolean, alt: boolean }, user: User; };
  doubleClick: { pos: { x: number, y: number, clientX: number; clientY: number }, modKeys: { ctrl: boolean, shift: boolean, alt: boolean }, user: User; };
  rightClick: { pos: { x: number, y: number, clientX: number; clientY: number }, modKeys: { ctrl: boolean, shift: boolean, alt: boolean }, user: User; };
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
  addStatusEffect: { actor: Actor, status: string };
  removeStatusEffect: { actor: Actor, status: string };
  selectToken: { token: Token, actor: Actor };
  deselectToken: { token: Token, actor: Actor };
  targetToken: { user: User, token: Token, actor: Actor };
  untargetToken: { user: User, token: Token, actor: Actor };
  worldTimeChange: { time: number };
  actorChange: { actor: Actor };
}




// export type TriggerEvent = typeof TriggerEvents[number];

interface BaseSerializedTrigger {
  id: string;
  label: string;
  action: string;
  version: string;
  event: keyof TriggerEventSignatures;
}


export const ActorTriggerEvents = ["actorChange", "addActiveEffect", "removeActiveEffect", "addStatusEffect", "removeStatusEffect"] as const;
export type ActorTriggerEvent = typeof ActorTriggerEvents[number];

interface ActorSerializedTrigger extends BaseSerializedTrigger {
  event: "actorChange" | "addActiveEffect" | "removeActiveEffect" | "addStatusEffect" | "removeStatusEffect";
  actor: string;
}



export type SerializedTrigger = BaseSerializedTrigger | ActorSerializedTrigger;

export type SerializedMacroTrigger = SerializedTrigger & ({
  macro: string;
  arguments: { name: string, value: any }[]
});

export interface FontSettings {
  family: string;
  size: number | string;
  color: PIXI.ColorSource;
  dropShadow: boolean;
}