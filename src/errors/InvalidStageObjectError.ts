import { LocalizedError } from './LocalizedError';
export class InvalidStageObjectError extends LocalizedError {
  constructor(key: unknown) {
    super("INVALIDSTAGEOBJECT", { key: typeof key === "string" ? key : typeof key });
  }
}