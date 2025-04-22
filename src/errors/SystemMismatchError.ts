import { LocalizedError } from './LocalizedError';
export class SystemMismatchError extends LocalizedError {
  constructor(system: unknown) {
    super("SYSTEMMISMATCH", { system: typeof system === "string" ? system : typeof system });
  }
}