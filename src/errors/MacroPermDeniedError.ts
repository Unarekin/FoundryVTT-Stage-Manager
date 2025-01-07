import { LocalizedError } from "./LocalizedError";

export class MacroPermDeniedError extends LocalizedError {
  constructor(macro: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    super("MACROPERMDENIED", { name: typeof macro === "string" ? macro : typeof (macro as any).toString === "function" ? (macro as any).toString() : typeof macro });
  }
}