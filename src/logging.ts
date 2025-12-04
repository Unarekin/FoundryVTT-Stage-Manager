const LOG_ICON = "🎭";

export function log(...args: unknown[]) {
  console.log(LOG_ICON, __MODULE_TITLE__, "|", ...args);
}

export function logError(err: Error) {
  ui.notifications?.error(err.message, { localize: true, console: false });
  console.error(err);
}

export function logInfo(message: string, ...addl: unknown[]) {
  ui.notifications?.info(message, { localize: true, console: false });
  console.info(LOG_ICON, __MODULE_TITLE__, "|", message, ...addl);
}

export function logWarn(message: string, ...addl: unknown[]) {
  ui.notifications?.warn(message, { localize: true, console: false });
  console.warn(LOG_ICON, __MODULE_TITLE__, "|", ...addl);
}