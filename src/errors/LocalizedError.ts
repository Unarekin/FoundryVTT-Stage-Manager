import { localize } from '../functions';
export class LocalizedError extends Error {
  constructor(message?: string, subs?: Record<string, string>) {
    if (message) super(localize(message, subs ?? {}));
    else super();
  }
}
