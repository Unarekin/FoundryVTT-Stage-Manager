import { LocalizedError } from "./LocalizedError";

export class InvalidContainerError extends LocalizedError {
  constructor() {
    super("INVALIDLAYER");
  }
}