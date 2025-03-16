import { Easing, PositionCoordinate } from "types";

export const ActionTypes = [
  "addSpeaker",
  "removeSpeaker",
  "conversationAlpha",
  "conversationSize",
  "conversationPosition",
  "speakerAlpha",
  "speakerSize",
  "speakerPosition",
  "text",
  "wait",
  "parallel",
  "series",
  "label",
  "textStyle",
  "labelStyle",
  "speakerScale",
  "speakerStyle",
  "conversationStyle",
  "macro"
] as const;
export type ActionType = typeof ActionTypes[number];

export interface SerializedAction {
  id: string;
  type: ActionType;
  version: string;
  label: string;
}

export interface SerializedSpeakerAction extends SerializedAction {
  speaker: string;
}

export interface SerializedWaitAction extends SerializedAction {
  duration: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializedAddSpeakerAction extends SerializedSpeakerAction { }
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializedRemoveSpeakerAction extends SerializedSpeakerAction { }

export interface SerializedConversationAlphaAction extends SerializedAction {
  start?: number;
  alpha: number;
  duration?: number;
  easing?: Easing;
}

export interface SerializedSpeakerAlphaAction extends SerializedSpeakerAction {
  start?: number;
  alpha: number;
  duration?: number;
  easing?: Easing;
}

export interface SerializedSpeakerSizeAction extends SerializedSpeakerAction {
  start?: {
    width?: PositionCoordinate;
    height?: PositionCoordinate;
  };
  end: {
    width?: PositionCoordinate;
    height?: PositionCoordinate;
  };
  duration?: number;
  easing?: Easing;
}

export interface SerializedSpeakerPositionAction extends SerializedSpeakerAction {
  start?: {
    x?: PositionCoordinate;
    y?: PositionCoordinate;
  };
  end: {
    x?: PositionCoordinate;
    y?: PositionCoordinate;
  };
  duration?: number;
  easing?: Easing;
}

export interface SerializedSpeakerScaleAction extends SerializedSpeakerAction {
  x?: PositionCoordinate;
  y?: PositionCoordinate;
  start?: {
    x?: PositionCoordinate;
    y?: PositionCoordinate;
  },
  anchor?: {
    x?: PositionCoordinate;
    y?: PositionCoordinate;
  };
  duration?: number;
  easing?: Easing;
}

export interface SerializedParallelAction extends SerializedAction {
  actions: SerializedAction[];
}

export interface SerializedTextAction extends SerializedAction {
  text: string;
  style: Record<string, unknown>;
  wait: number;
}

export interface SerializedLabelAction extends SerializedAction {
  text: string;
  style: Record<string, unknown>;
}

export interface SerializedSpeakerStyleAction extends SerializedSpeakerAction {
  textStyle: Record<string, unknown>;
  labelStyle: Record<string, unknown>;
}

export interface SerializedConversationStyleAction extends SerializedAction {
  textStyle: Record<string, unknown>;
  labelStyle: Record<string, unknown>;
}

export interface SerializedMacroAction extends SerializedAction {
  macro: string;
}
