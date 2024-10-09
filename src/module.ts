import { log } from './logging';
import * as rxjs from "rxjs";
import * as MiniRX from 'mini-rx-store';


Hooks.on("ready", () => {
  log(`${__MODULE_TITLE__} ready!`);
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(<any>window).rxjs = rxjs;

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(<any>window).MiniRX = MiniRX;