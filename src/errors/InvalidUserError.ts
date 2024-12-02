import { LocalizedError } from "./LocalizedError";

export class InvalidUserError extends LocalizedError {
  constructor(arg: unknown) {
    super("INVALIDUSER", { user: typeof arg === "string" ? arg : typeof arg });
  }
}