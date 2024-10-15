import { LocalizedError } from './LocalizedError';
export class InvalidFormDataError extends LocalizedError {
  constructor() {
    super("INVALIDFORMDATA");
  }
}