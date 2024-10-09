"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = exports.error = exports.warn = exports.log = void 0;
/** Icon to prepend to log messages, to make it easier to locate them in the console. */
const LOG_ICON = "🎭";
const LOG_PREFIX = `${LOG_ICON} ${__MODULE_TITLE__}`;
exports.log = wrappedConsoleFunc(console.log);
exports.warn = wrappedConsoleFunc(console.warn);
exports.error = wrappedConsoleFunc(console.error);
exports.info = wrappedConsoleFunc(console.info);
function wrappedConsoleFunc(original) {
    return function (...args) {
        const shouldLog = __DEV__ ? true : typeof args[0] === "boolean" ? args[0] : false;
        const actualArgs = args;
        if (shouldLog)
            original(LOG_PREFIX, "|", ...actualArgs);
        // console.log(LOG_PREFIX, "|", ...actualArgs);
    };
}
