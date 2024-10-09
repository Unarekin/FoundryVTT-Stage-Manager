import { log } from './logging';
import { ActorDock } from "./lib/ActorDock"


Hooks.on("ready", () => {
  log(`${__MODULE_TITLE__} ready!`);
  log(new ActorDock("Test Dock", "uploads/images/avatars/EricaNoKittyAvatar.png"));
});