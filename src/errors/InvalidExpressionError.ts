import { LocalizedError } from './LocalizedError';
export class InvalidExpressionError extends LocalizedError {
  constructor(expression: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    super("INVALIDEXPRESSION", { expression: typeof expression === "string" ? expression : typeof (expression as any).toString === "function" ? (expression as any).toString() : typeof expression});
  }
}