import { log } from './logging';
import * as rxjs from "rxjs";
import * as MiniRX from 'mini-rx-store';

import StageManager from './lib/StageManager';


// Elevate some objects to global state



// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).rxjs = rxjs;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
(window as any).MiniRX = MiniRX;




Hooks.on("ready", () => {
  const stageManager = new StageManager();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (window as any).StageManager = stageManager

  log(`${__MODULE_TITLE__} ready!`);
});

