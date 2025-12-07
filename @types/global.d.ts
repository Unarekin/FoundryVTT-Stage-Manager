import { StageManager } from "../src/StageManager";
import { SerializedStageObject, StageLayer } from "../src/types";
import { gsap as gsapType } from "gsap";

declare global {

  declare const __DEV__: boolean;
  declare const __MODULE_TITLE__: string;
  // declare const __MODULE_ID__: string;
  const __MODULE_ID__ = "stage-manager";
  declare const __MODULE_VERSION__: string;

  declare const libWrapper: any;
  declare const socketlib: any;

  declare module '*.scss';

  declare const gsap: gsapType;

  interface Game {
    StageManager: StageManager;
  }

  interface Canvas {
    stageLayers: Record<StageLayer, ScreenSpaceCanvasGroup>;
  }

  interface SettingConfig {
    "stage-manager.globalStageObjects": Record<string, SerializedStageObject>;
  }
}