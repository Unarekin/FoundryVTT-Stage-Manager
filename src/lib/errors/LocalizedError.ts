export class LocalizedError extends Error {
  constructor(message?: string, subs?: { [x: string]: unknown }) {
    if (message) super(game.i18n?.format(`STAGEMANAGER.ERRORS.${message}`, subs))
    else super();
  }
}