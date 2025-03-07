export const ActionTypes = [
  "addSpeaker",
  "removeSpeaker",
  "speakerAlpha",
  "speakerPosition",
  "speakerSize",
  "conversationAlpha",
  "conversationPosition",
  "conversationSize",
  "text",
  "multi"
] as const;

export type ActionType = typeof ActionTypes[number];

export const SpeakerAnimations = [
  "slideLeft",
  "slideRight",
  "slideDown",
  "slideUp",
  "fade",
  "none"
] as const;
export type SpeakerAnimation = typeof SpeakerAnimations[number];

export interface SerializedAction {
  id: string;
  version: string;
  type: ActionType;
  label: string;
}

export interface SerializedSpeakerAction extends SerializedAction {
  speaker: string;
}

export interface SerializedAddSpeakerAction extends SerializedSpeakerAction {
  animation: SpeakerAnimation;
  duration: number;
}