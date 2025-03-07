import { LocalizedError } from "./LocalizedError";

export class InvalidSpeakerTypeError extends LocalizedError {
  constructor(speakerType: unknown) {
    super("INVALIDSPEAKERTYPE", { type: typeof speakerType === "string" ? speakerType : typeof speakerType });
  }
}