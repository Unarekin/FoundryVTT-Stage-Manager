import { Effect } from "./types";
import { SerializedGlowEffect } from '../types';
import { parseForm } from "./functions";

export const GlowEffect: Effect<SerializedGlowEffect> = {
  type: "glow",
  label: "GLOW",
  template: "glow.hbs",
  default: {
    id: "",
    version: __MODULE_ID__,
    type: "glow",
    innerStrength: 0,
    outerStrength: 4,
    quality: 0.1,
    color: "FFFFFFFF",
    glowOnly: false,
    temporary: false
  },
  serialize(filter: PIXI.Filter): SerializedGlowEffect {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const color = new PIXI.Color((filter as any).color);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    color.setAlpha((filter as any).alpha);

    return {
      ...GlowEffect.default,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: (filter as any).id ?? foundry.utils.randomID(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      glowOnly: (filter as any).knockout,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      quality: (filter as any).quality * 100,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      innerStrength: (filter as any).innerStrength,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      outerStrength: (filter as any).outerStrength,
      color: color.toHexa(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      temporary: (filter as any).temporary ?? false
    }
  },
  deserialize(serialized: SerializedGlowEffect): PIXI.Filter {
    const color = new PIXI.Color(serialized.color);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const filter = (PIXI.filters as any).GlowFilter({
      innerStrength: serialized.innerStrength,
      outerStrengtH: serialized.outerStrength,
      color: color.toNumber(),
      alpha: color.alpha,
      knockout: serialized.glowOnly,
      quality: serialized.quality / 100
    }) as PIXI.Filter;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (filter as any).id = serialized.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (filter as any).temporary = serialized.temporary ?? false;
    return filter;
  },
  fromForm(parent: HTMLElement) {
    return {
      ...GlowEffect.default,
      ...parseForm(parent)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeCheck(filter: PIXI.Filter): boolean { return filter instanceof (PIXI.filters as any).GlowFilter; }

}