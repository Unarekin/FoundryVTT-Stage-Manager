import { LocalizedError } from "./LocalizedError";

export class UnknownDocumentTypeError extends LocalizedError {
  constructor(name: unknown) {
    super("UNKNOWNDOCUMENTTYPE", { document: typeof name === "string" ? name : typeof name });
  }
}