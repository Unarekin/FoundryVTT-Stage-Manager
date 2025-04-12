import { LocalizedError } from "./LocalizedError";

export class InvalidUUIDError extends LocalizedError {
  constructor(uuid: unknown) {
    super("INVALIDUUID", { uuid: typeof uuid === "string" ? uuid : typeof uuid });
  }
}