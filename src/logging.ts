
/** Icon to prepend to log messages, to make it easier to locate them in the console. */
const LOG_ICON: string = "🎭";
const LOG_PREFIX: string = `${LOG_ICON} ${__MODULE_TITLE__}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFunction = (...data: any[]) => void;

export const log = wrappedConsoleFunc(console.log);
export const warn = wrappedConsoleFunc(console.warn);
export const error = wrappedConsoleFunc(console.error);
export const info = wrappedConsoleFunc(console.info);

function wrappedConsoleFunc(original: LogFunction): LogFunction {
  return function (this: unknown, ...args: unknown[]): void {
    const shouldLog: boolean = __DEV__ ? true : typeof args[0] === "boolean" ? args[0] : false;
    const actualArgs = args;


    if (shouldLog)
      original(LOG_PREFIX, "|", ...actualArgs);

    // console.log(LOG_PREFIX, "|", ...actualArgs);
  }
}
