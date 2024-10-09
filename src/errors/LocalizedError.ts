export class LocalizedError extends Error {
  constructor(message?: string, subs?: { [x: string]: unknown }) {
    if (message) super((<Game>game).i18n?.format(`STAGEMANAGER.ERRORS.${message}`, subs))
    else super();
  }
}