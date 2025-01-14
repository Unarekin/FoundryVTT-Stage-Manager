import type { AnyObject } from "Foundry-VTT/src/types/utils.d.mts";
import { SerializedStageObject, SerializedTrigger, StageLayer, TriggerEventSignatures } from "../types";

export type Tab = foundry.applications.api.ApplicationV2.Tab;

export interface StageObjectApplicationContext extends AnyObject {
  stageObject: SerializedStageObject;
  tabs?: Record<string, Tab>;
  tab?: Tab;
  buttons?: foundry.applications.api.ApplicationV2.FormFooterButton[];
}

export interface ActorStageObjectApplicationContext extends StageObjectApplicationContext {
  actorSelect: Record<string, string>;
  actor: string;
}

export interface StageObjectApplicationConfiguration extends foundry.applications.api.ApplicationV2.Configuration {
  layer: StageLayer;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ImageStageObjectApplicationConfiguration extends StageObjectApplicationConfiguration { }
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ActorStageObjectApplicationConfiguration extends ImageStageObjectApplicationConfiguration { }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StageObjectApplicationOptions extends foundry.applications.api.ApplicationV2.RenderOptions {

}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ImageStageObjectApplicationOptions extends StageObjectApplicationOptions { }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ActorStageObjectApplicationOptions extends ImageStageObjectApplicationOptions { }

export interface StageObjectApplicationTab {
  icon?: string;
  label: string;
  templates: string[];
  cssClasses?: string[];
}

export interface TriggerDialogResult {
  trigger: SerializedTrigger;
  event: keyof TriggerEventSignatures
}