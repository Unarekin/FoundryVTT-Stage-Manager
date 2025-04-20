import { BevelEffect } from "./bevel";
import { BlurEffect } from "./blur";
import { ChromaKeyEffect, ChromaKeyFilter } from './chromakey';
import { DropShadowEffect } from './dropshadow';
import { GlowEffect } from './glow';
import { HologramEffect, HologramFilter } from './hologram';
import { InvertEffect, InvertFilter } from './invert';
import { PixelateEffect } from './pixelate';
import { OutlineEffect } from './outline';

const effects = {
  BevelEffect, BlurEffect,
  ChromaKeyEffect, DropShadowEffect,
  GlowEffect, HologramEffect,
  InvertEffect, PixelateEffect,
  OutlineEffect
}
const filters = {
  ChromaKeyFilter, HologramFilter, InvertFilter
}

export { effects, filters };
export * from './types';