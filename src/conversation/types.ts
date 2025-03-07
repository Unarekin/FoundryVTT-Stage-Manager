import { SerializedActorStageObject, SerializedImageStageObject } from "../types";
import { SerializedAction } from "./actions/types";

export const SpeakerTypes = [
  "actor",
  "image"
] as const;
export type SpeakerType = typeof SpeakerTypes[number];


export interface SerializedConversation {
  id: string;
  version: string;
  speakers: SerializedSpeaker[];
  queue: SerializedAction[];
}

export interface SerializedSpeaker {
  version: string;
  type: SpeakerType;
  object: SerializedImageStageObject | SerializedActorStageObject;
}