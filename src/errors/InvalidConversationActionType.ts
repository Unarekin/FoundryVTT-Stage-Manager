import { LocalizedError } from "./LocalizedError";

export class InvalidConversationActionTypeError extends LocalizedError {
  constructor(actionType: unknown) {
    super("INVALIDCONVERSATIONACTIONTYPE", { type: typeof actionType === "string" ? actionType : typeof actionType });
  }
}