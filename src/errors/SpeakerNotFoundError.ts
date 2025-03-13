import { LocalizedError } from "./LocalizedError";

export class SpeakerNotFoundError extends LocalizedError {
  constructor(speaker: unknown) {

    super("SPEAKERNOTFOUND", {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      speaker: typeof speaker === "string" ? speaker : typeof (speaker as any).id === "string" ? (speaker as any).id : typeof speaker
    });
  }
}