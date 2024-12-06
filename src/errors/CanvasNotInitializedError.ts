import { LocalizedError } from "./LocalizedError";

export class CanvasNotInitializedError extends LocalizedError {
  constructor() {
    super("CANVASNOTINITIALIZED");
  }
}