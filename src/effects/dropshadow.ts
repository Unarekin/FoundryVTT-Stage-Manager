import { SerializedDropShadowEffect } from '../types';
import { Effect } from "./types";
import { parseForm } from "./functions";

export const DropShadowEffect: Effect<SerializedDropShadowEffect> = {
  type: "dropshadow",
  label: "DROPSHADOW",
  template: "dropshadow.hbs",
  default: {
    id: "",
    type: "dropshadow",
    version: __MODULE_VERSION__,
    offsetX: 4,
    offsetY: 4,
    color: "#00000080",
    blur: 2,
    quality: 3
  },
  fromForm(parent: HTMLElement) {
    const parsed = parseForm(parent);

    const value = {
      ...DropShadowEffect.default,
      id: foundry.utils.randomID(),
      ...parsed
    }
    return value;
  },
  serialize(filter: PIXI.Filter): SerializedDropShadowEffect {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const color = new PIXI.Color((filter as any).color);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    color.setAlpha((filter as any).alpha);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const offset = (filter as any).offset as { x: number, y: number };

    return {
      ...DropShadowEffect.default,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: (filter as any).id ?? foundry.utils.randomID(),
      offsetX: offset.x,
      offsetY: offset.y,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      blur: (filter as any).blur,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      quality: (filter as any).quality,
      color: color.toHexa()
    }
  },
  deserialize(serialized: SerializedDropShadowEffect): PIXI.Filter {
    const color = new PIXI.Color(serialized.color);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const filter = (PIXI.filters as any).DropShadowFilter({
      offset: { x: serialized.offsetX, y: serialized.offsetY },
      blur: serialized.blur,
      quality: serialized.quality,
      color: color.toNumber(),
      alpha: color.alpha
    }) as PIXI.Filter;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (filter as any).id = serialized.id;
    return filter;
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeCheck(filter: PIXI.Filter): boolean { return filter instanceof (PIXI.filters as any).DropShadowFilter }
}
