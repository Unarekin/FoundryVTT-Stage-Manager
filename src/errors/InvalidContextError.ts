
import { LocalizedError } from './LocalizedError';
export class InvalidContextError extends LocalizedError {
  constructor() {
    super("INVALIDCONTEXT");
  }
}