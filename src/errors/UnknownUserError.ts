import { LocalizedError } from "./LocalizedError";

export class UnknownUserError extends LocalizedError {
  constructor(user: unknown) {
    super("UNKNOWNUSER", { user: typeof user === "string" ? user : typeof user });
  }
}