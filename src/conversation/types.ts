import { SerializedAction } from './actions/types';



export interface SerializedConversation {
  id: string;
  version: string;
  actions: SerializedAction[];
  speakers: SerializedSpeaker[];
}

export interface SerializedSpeaker {
  id: string;
  version: string;
  speaker: string;
}