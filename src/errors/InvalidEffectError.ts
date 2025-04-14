import { LocalizedError } from "./LocalizedError";

export class InvalidEffectError extends LocalizedError {
  constructor(effect: unknown) {
    super("INVALIDEFFECT", { effect: typeof effect === "string" ? effect : typeof effect });
  }
}