import { LocalizedError } from "./LocalizedError"

export class CannotCopyError extends LocalizedError {
  constructor(reason: string) {
    super("CANNOTCOPY", {message: reason});
  }
}