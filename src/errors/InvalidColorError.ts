import { LocalizedError } from "./LocalizedError";

export class InvalidColorError extends LocalizedError {
  constructor(color: unknown) {
    super("INVALIDCOLOR", { color: typeof color === "string" ? color : typeof color });
  }
}