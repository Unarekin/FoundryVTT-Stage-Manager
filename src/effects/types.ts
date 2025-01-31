import { EffectType, SerializedEffect } from "../types";

export interface Effect<t extends SerializedEffect = SerializedEffect> {
  type: EffectType,
  default: t;
  label: string;
  template: string;
  fromForm(parent: HTMLElement): t;
  deserialize(serialized: t): PIXI.Filter;
  serialize(filter: PIXI.Filter): t;
  typeCheck(filter: PIXI.Filter): boolean;
}