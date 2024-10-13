import { LocalizedError } from './LocalizedError';
export class InvalidImageError extends LocalizedError {
  constructor() {
    super("INVALIDIMAGE");
  }
}