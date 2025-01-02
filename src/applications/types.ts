import type { AnyObject } from "Foundry-VTT/src/types/utils.d.mts";
import { SerializedStageObject, StageLayer } from "../types";

export type Tab = foundry.applications.api.ApplicationV2.Tab;

export interface StageObjectApplicationContext extends AnyObject {
  stageObject: SerializedStageObject;
  tabs?: Record<string, Tab>;
  tab?: Tab;
  buttons?: foundry.applications.api.ApplicationV2.FormFooterButton[];
}

export interface StageObjectApplicationConfiguration extends foundry.applications.api.ApplicationV2.Configuration {
  layer: StageLayer;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StageObjectApplicationOptions extends foundry.applications.api.ApplicationV2.RenderOptions {

}

export interface StageObjectApplicationTab {
  icon?: string;
  label: string;
  templates: string[];
  cssClasses?: string[];
}