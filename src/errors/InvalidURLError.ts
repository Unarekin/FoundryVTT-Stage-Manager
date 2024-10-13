import { LocalizedError } from './LocalizedError';
export class InvalidURLError extends LocalizedError {
  constructor(url: string) {
    super("INVALIDURL", { url });
  }
}