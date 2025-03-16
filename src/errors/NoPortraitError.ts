import { LocalizedError } from "./LocalizedError";

export class NoPortraitError extends LocalizedError {
  constructor() {
    super("NOPORTRAIT");
  }
}