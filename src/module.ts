import { log } from './logging';
import * as rxjs from "rxjs";
import * as MiniRX from 'mini-rx-store';

import api from "./api";
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).StageManager = api;

Hooks.on("ready", () => {
  log(`${__MODULE_TITLE__} ready!`);
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).rxjs = rxjs;

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).MiniRX = MiniRX;


const store: MiniRX.Store = MiniRX.configureStore({
  extensions: [
    new MiniRX.ReduxDevtoolsExtension({
      name: "Stage Manager Store",
      maxAge: 25,
      latency: 1000
    })
  ]
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(api as any).store = store;
