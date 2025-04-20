// import * as effects from "../effects";
import { effects, Effect } from "effects";
import { SerializedEffect } from "../types";

export function serializeEffect(effect: PIXI.Filter): SerializedEffect | undefined {
  const types = Object.values(effects);
  for (const effectType of types) {
    if (effectType.typeCheck(effect))
      return effectType.serialize(effect);
  }
}

export function deserializeEffect(serialized: SerializedEffect): PIXI.Filter | undefined {
  const handler = getEffectHandler(serialized.type);
  if (handler)
    return handler.deserialize(serialized);
}

export function defaultEffect(effectType: string): SerializedEffect | undefined {
  const handler = getEffectHandler(effectType);
  if (handler)
    return handler.default;
}

export function getEffectHandler(effectType: string): Effect | undefined {
  return Object.values(effects).find(effect => effect.type === effectType);
}

export function getEffectTemplate(effectType: string): string | undefined {
  const handler = getEffectHandler(effectType);
  if (handler)
    return handler.template;
}
