import { SerializedOutlineEffect } from '../types';
import { Effect } from "./types";
import { parseForm } from './functions';

export const OutlineEffect: Effect<SerializedOutlineEffect> = {
  type: "outline",
  label: "OUTLINE",
  template: "outline.hbs",
  default: {
    id: "",
    type: "outline",
    version: __MODULE_VERSION__,
    color: "#FF0000",
    thickness: 2,
    outlineOnly: false,
    quality: .1,
    temporary: false
  },
  serialize(filter: PIXI.Filter): SerializedOutlineEffect {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const color = new PIXI.Color((filter as any).color);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    color.setAlpha((filter as any).alpha);


    return {
      ...OutlineEffect.default,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: (filter as any).id ?? foundry.utils.randomID(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      outlineOnly: (filter as any).knockout,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      thickness: (filter as any).thickness,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      quality: (filter as any).quality * 100,
      color: color.toHexa(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      temporary: (filter as any).temporary ?? false
    }
  },
  deserialize(serialized: SerializedOutlineEffect): PIXI.Filter {
    const color = new PIXI.Color(serialized.color);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const filter = new (PIXI.filters as any).OutlineFilter(serialized.thickness, color.toNumber());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    filter.alpha = color.alpha;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    filter.quality = serialized.quality / 100;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    filter.knockout = serialized.outlineOnly;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    filter.id = serialized.id ?? foundry.utils.randomID();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    filter.temporary = serialized.temporary ?? false

    return filter as PIXI.Filter;
  },
  fromForm(parent: HTMLElement) {
    return {
      ...OutlineEffect.default,
      id: foundry.utils.randomID(),
      ...parseForm(parent)
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeCheck(filter: PIXI.Filter): boolean { return filter instanceof (PIXI.filters as any).OutlineFilter; }
}