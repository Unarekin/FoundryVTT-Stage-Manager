import { LocalizedError } from "./LocalizedError";

export class InvalidResourcePathError extends LocalizedError {
  constructor(path: string) {
    super("INVALIDRESOURCEPATH", {path});
  }
}