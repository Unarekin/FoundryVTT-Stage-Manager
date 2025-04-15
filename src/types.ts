import { SerializedAsset } from "./lib/textureSerialization";
import { StageObject } from "./stageobjects";

// export type StageLayer = "primary" | "foreground" | "background" | "text" | "ui";
export const StageLayers = ["primary", "foreground", "background", "ui"] as const;
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
  visible: boolean;
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
  mask: string;
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
  tint: string;
  blendMode: number;
  anchor: {
    x: number;
    y: number;
  };
}

export interface SerializedActorStageObject extends SerializedImageStageObject {
  actor: string;
}

export interface SerializedTextStageObject extends SerializedStageObject {
  text: string;
  style: Record<string, unknown>;
  anchor: {
    x: number;
    y: number;
  };
}

export interface SerializedPanelStageObject extends SerializedStageObject {
  borders: Border;
  src: string;
  blendMode: number;
  tint: string;
}

export interface SerializedDialogueStageObject extends SerializedStageObject {

  text: SerializedTextStageObject;
  panel: SerializedPanelStageObject;
  speakers: SerializedSpeaker[];
  label: SerializedTextStageObject;

  speakerSlotWidth: number;
  speakerSlotTop: PositionCoordinate;
  maxSpeakerHeight: number;
  maxSpeakerWidth: number;
}

export type SerializedSpeaker = SerializedImageStageObject | SerializedActorStageObject;

export const ProgressTextModes = ["none", "values", "percentage"] as const;
export type ProgressTextMode = typeof ProgressTextModes[number];

export interface Border {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface SerializedProgressStageObject extends SerializedStageObject {
  max: number;
  value: number;
  textMode: ProgressTextMode;
  textStyle: Record<string, unknown>;
  lerpEasing: Easing;
  primaryLerpTime: number;
  secondaryLerpTime: number;
  clamp: boolean;
  animateValueChanges: boolean;
}

export interface SerializedProgressBarStageObject extends SerializedProgressStageObject {
  bgSprite: string;
  fgSprite: string;
  lerpSprite: string;

  fgBorder: Border;
  bgBorder: Border;
  lerpBorder: Border;

  fgBlendMode: number;
  bgBlendMode: number;
  lerpBlendMode: number;

  fgTint: string;
  bgTint: string;
  lerpTint: string;

  fgPadding: Border;

  textAlignment: "left" | "right" | "center"
}

export interface SerializedResourceBarStageObject extends SerializedProgressBarStageObject {
  object: string;
  maxPath: string;
  valuePath: string;
}

export interface SerializedProgressClockStageObject extends SerializedProgressStageObject {
  bgSprite: string;
  fgSprite: string;
  lerpSprite: string;

  fgBlendMode: number;
  bgBlendMode: number;
  lerpBlendMode: number;

  fgTint: string;
  bgTint: string;
  lerpTint: string;

  fgPadding: Border;
  textHAlignment: "left" | "center" | "right";
  textVAlignment: "top" | "center" | "bottom";

  swapLayers: boolean;
}

export interface SerializedResourceClockStageObject extends SerializedProgressClockStageObject {
  object: string;
  maxPath: string;
  valuePath: string;
}

/*
export const StageLayers = ["primary", "foreground", "background", "text", "ui"] as const;
export type StageLayer = typeof StageLayers[number];
*/

export const EffectTypes = ["outline", "dropshadow", "blur", "pixelate", "glow", "bevel", "chromakey", "hologram", "invert"] as const;
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

export interface SerializedChromaKeyEffect extends SerializedEffect {
  type: "chromakey";
  keyColor: string;
  range: [number, number];
  backgroundType: "image" | "color";
  backgroundImage?: SerializedAsset;
  backgroundColor?: string;
}

export interface SerializedHologramEffect extends SerializedEffect {
  type: "hologram";
  noise: number;
  alpha: number;
  speed: number;
  color1: string;
  color2: string;
  lines: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializedInvertEffect extends SerializedEffect { }

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
  "sm-select-background": "background"
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

  itemRoll: { actor: Actor, item: Item, rollData: Record<string, unknown> }
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

export const Easings = [
  "none",
  "power1.out", "power1.in", "power1.inOut",
  "power2.in", "power2.out", "power2.inOut",
  "power3.in", "power3.out", "power3.inOut",
  "power4.in", "power4.out", "power4.inOut",
  "back.in", "back.out", "back.inOut",
  "bounce.in", "bounce.out", "bounce.inOut",
  "circ.in", "circ.out", "circ.inOut",
  "elastic.in", "elastic.out", "elastic.inOut",
  "expo.in", "expo.out", "expo.inOut",
  "sine.in", "sine.out", "sine.inOut",
  // "steps", "rough", "slow", "expoScale"
  // These easings need arguments, to be implemented later
] as const;

export type Easing = typeof Easings[number];

export type PositionCoordinate = number | string;

export interface SpeakerPosition {
  x: PositionCoordinate;
  y: PositionCoordinate;
  z: PositionCoordinate;
}

export interface ActorResource {
  max: number;
  value: number;
  min?: number;
}