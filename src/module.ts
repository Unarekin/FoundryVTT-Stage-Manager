import { log } from './logging';
import * as rxjs from "rxjs";
import * as MiniRX from 'mini-rx-store';

import StageManager from './lib/StageManager';

const stageManager = new StageManager();

// Elevate some objects to global state
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).rxjs = rxjs;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).MiniRX = MiniRX;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).StageManager = stageManager;

Hooks.on("getSceneControlButtons", stageManager.registerSceneControlButtons.bind(stageManager));

// Hooks.once("init", () => {

// })

Hooks.once("ready", () => {
  stageManager.intializeCanvas();
  log(`${__MODULE_TITLE__} ready!`);
});

