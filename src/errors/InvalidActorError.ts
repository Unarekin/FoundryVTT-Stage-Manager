import { LocalizedError } from "./LocalizedError";

export class InvalidActorError extends LocalizedError {
  constructor(name: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    super("INVALIDACTOR", { name: typeof name === "string" ? name : typeof (name as any).toString() === "function" ? (name as any).toString() : typeof name });
  }
}