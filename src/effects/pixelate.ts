import { Effect } from './types';
import { SerializedPixelateEffect } from '../types';
import { parseForm } from './functions';

export const PixelateEffect: Effect<SerializedPixelateEffect> = {
  type: "pixelate",
  label: "PIXELATE",
  template: "pixelate.hbs",
  default: {
    id: "",
    version: __MODULE_VERSION__,
    type: "pixelate",
    size: 5
  },
  serialize(filter: PIXI.Filter): SerializedPixelateEffect {
    return {
      ...PixelateEffect.default,
      id: foundry.utils.randomID(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      size: (filter as any).size[0]
    }
  },
  deserialize(serialized: SerializedPixelateEffect): PIXI.Filter {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return new (PIXI.filters as any).PixelateFilter(serialized.size);
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  typeCheck(filter: PIXI.Filter): boolean { return filter instanceof (PIXI.filters as any).PixelateFilter; },
  fromForm(parent: HTMLElement): SerializedPixelateEffect {

    return {
      ...PixelateEffect.default,
      id: foundry.utils.randomID(),
      ...parseForm(parent),
    }
  }
}

