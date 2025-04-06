import { LocalizedError } from "./LocalizedError";

export class InvalidApplicationClassError extends LocalizedError {
  constructor(name: unknown) {
    super("INVALIDAPPLICATIONCLASS", { name: typeof name === "string" ? name : typeof name });
  }
}