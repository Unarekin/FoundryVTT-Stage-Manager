import { log } from './logging';


Hooks.on("ready", () => {
  log(`${__MODULE_TITLE__} ready!`);
});