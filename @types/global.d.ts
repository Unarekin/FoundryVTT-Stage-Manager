import { StageManager } from "../src/StageManager";
import { SerializedStageObject, StageLayer } from "../src/types";

declare global {

  declare const __DEV__: boolean;
  declare const __MODULE_TITLE__: string;
  // declare const __MODULE_ID__: string;
  const __MODULE_ID__ = "stage-manager";
  declare const __MODULE_VERSION__: string;

  declare const libWrapper: any;
  declare const socketlib: any;

  declare module '*.scss';

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