import { LocalizedError } from "./LocalizedError";

export class InvalidActorTypeError extends LocalizedError {
  constructor(actorType: unknown) {
    super("INVALIDACTORTYPE", { type: typeof actorType === "string" ? actorType : typeof actorType});
  }
}