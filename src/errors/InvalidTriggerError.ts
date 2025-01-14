import { LocalizedError } from "./LocalizedError";

export class InvalidTriggerError extends LocalizedError {
  constructor(triggerType: string) {
    super("INVALIDTRIGGERTYPE", { type: typeof triggerType === "string" ? triggerType : typeof triggerType });
  }
}