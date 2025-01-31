import { SerializedBevelEffect } from '../types';
import { Effect } from './types';
import { parseForm } from "./functions";

export const BevelEffect: Effect<SerializedBevelEffect> = {
  type: "bevel",
  label: "BEVEL",
  default: {
    id: "",
    type: "bevel",
    version: __MODULE_VERSION__,
    lightColor: "#FFFFFFB2",
    shadowColor: "#000000B2",
    rotation: 45,
    thickness: 2
  },
  template: 'bevel.hbs',

  fromForm(parent: HTMLElement) {
    return {
      ...BevelEffect.default,
      id: foundry.utils.randomID(),
      ...parseForm(parent),
    }
  },
  deserialize(serialized: SerializedBevelEffect): PIXI.Filter {

    const lightColor = new PIXI.Color(serialized.lightColor);
    const shadowColor = new PIXI.Color(serialized.shadowColor);


    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return new (PIXI.filters as any).BevelFilter({
      rotation: serialized.rotation,
      thickness: serialized.thickness,
      lightColorAlpha: lightColor.alpha,
      shadowAlpha: shadowColor.alpha,
      lightColor: lightColor.toNumber(),
      shadowColor: shadowColor.toNumber()
    });
  },
  serialize(filter: PIXI.Filter): SerializedBevelEffect {

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const lightColor = new PIXI.Color((filter as any).lightColor);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const shadowColor = new PIXI.Color((filter as any).shadowColor);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    lightColor.setAlpha((filter as any).lightAlpha);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    shadowColor.setAlpha((filter as any).shadowAlpha);


    return {
      ...BevelEffect.default,
      id: foundry.utils.randomID(),
      lightColor: lightColor.toHexa(),
      shadowColor: shadowColor.toHexa(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      rotation: (filter as any).rotation,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      thickness: (filter as any).thickness
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeCheck(filter: PIXI.Filter): boolean { return filter instanceof (PIXI.filters as any).BevelFilter; }
}
