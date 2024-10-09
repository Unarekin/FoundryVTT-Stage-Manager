import { log } from './logging';
import * as rxjs from "rxjs";
import * as MiniRX from 'mini-rx-store';
import "./store.ts";
import api from "./api";
import { ActorDock } from './lib/ActorDock/ActorDock';


// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).StageManager = api;

Hooks.on("ready", () => {
  log(`${__MODULE_TITLE__} ready!`);

  const dock = new ActorDock("Test Actor", "uploads/images/avatars/EricaNoKittyAvatar.png");
  console.log("Dock:", dock);
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).rxjs = rxjs;

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).MiniRX = MiniRX;

