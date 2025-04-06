import { SerializedTrigger } from '../types';
import { MacroTriggerAction } from './MacroTriggerAction';
import { TriggerAction } from './TriggerAction';

export const triggerActions: Record<string, typeof TriggerAction> = {
  macro: MacroTriggerAction
}


export function getTriggerActionType(trigger: SerializedTrigger | string): typeof TriggerAction | undefined {
  return triggerActions[typeof trigger === "string" ? trigger : trigger.action];
}