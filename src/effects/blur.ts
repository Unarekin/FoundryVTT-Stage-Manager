import { SerializedBlurEffect } from '../types';
import { Effect } from "./types";

export const BlurEffect: Effect<SerializedBlurEffect> = {
  type: "blur",
  label: "BLUR",
  default: {
    type: "blur",
    version: __MODULE_VERSION__,
    strength: 0,
    quality: 4,
    id: ""
  },
  template: "blur.hbs",
  fromForm(parent: HTMLElement) {
    const strengthElem = parent.querySelector(`input[name="effect.strength"]`);
    const qualityElem = parent.querySelector(`input[name="effect.quality"]`);
    const idElem = parent.querySelector(`input[name="effect.id"]`);

    return {
      ...BlurEffect.default,
      ...(idElem instanceof HTMLInputElement ? { id: idElem.value } : {}),
      ...(strengthElem instanceof HTMLInputElement ? { strength: parseFloat(strengthElem.value) } : {}),
      ...(qualityElem instanceof HTMLInputElement ? { quality: parseFloat(qualityElem.value) } : {})
    };
  },
  typeCheck(filter) { return filter instanceof PIXI.BlurFilter; },
  deserialize(serialized: SerializedBlurEffect) {
    const filter = new PIXI.BlurFilter(serialized.strength, serialized.quality);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (filter as any).id = serialized.id;
    return filter;
  },
  serialize(filter: PIXI.BlurFilter) {
    return {
      ...BlurEffect.default,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: (filter as any).id ?? foundry.utils.randomID(),
      strength: filter.blur,
      quality: filter.quality
    };
  },
}