export class LocalizedError extends Error {
  constructor(message?: string, subs?: Record<string, unknown>) {
    if (message) super((game as Game).i18n?.format(`STAGEMANAGER.ERRORS.${message}`, subs));
    else super();
  }
}
