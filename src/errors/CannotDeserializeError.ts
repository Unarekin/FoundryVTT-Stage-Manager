import { LocalizedError } from "./LocalizedError";

export class CannotDeserializeError extends LocalizedError {
  constructor(arg: unknown) {
    super("CANNOTDESERIALIZE", { type: typeof arg === "string" ? arg : typeof arg });
  }
}