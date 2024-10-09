"use strict";
(() => {
  // src/logging.ts
  var LOG_ICON = "\u{1F3AD}";
  var LOG_PREFIX = `${LOG_ICON} ${"Stage Manager"}`;
  var log = wrappedConsoleFunc(console.log);
  var warn = wrappedConsoleFunc(console.warn);
  var error = wrappedConsoleFunc(console.error);
  var info = wrappedConsoleFunc(console.info);
  function wrappedConsoleFunc(original) {
    return function(...args) {
      const shouldLog = true ? true : typeof args[0] === "boolean" ? args[0] : false;
      const actualArgs = args;
      if (shouldLog)
        original(LOG_PREFIX, "|", ...actualArgs);
    };
  }

  // src/module.ts
  Hooks.on("ready", () => {
    log(`${"Stage Manager"} ready!`);
  });
})();
//# sourceMappingURL=module.js.map
