import { InvalidEffectError } from 'errors';
import { SerializedInvertEffect } from '../types';
import { CustomFilter } from './CustomFilter';
import { Effect } from "./types";
import { parseForm } from './functions';

export const InvertEffect: Effect<SerializedInvertEffect> = {
  type: "invert",
  label: "INVERT",
  template: "invert.hbs",
  default: {
    id: "",
    version: __MODULE_VERSION__,
    type: "invert",
    temporary: false
  },
  serialize(filter: InvertFilter): SerializedInvertEffect {
    if (!(filter instanceof InvertFilter)) throw new InvalidEffectError(filter);
    return {
      ...InvertEffect.default,
      id: filter.id,
      temporary: filter.temporary
    };
  },

  deserialize(serialized: SerializedInvertEffect): InvertFilter {
    const filter = new InvertFilter();
    filter.id = serialized.id ?? foundry.utils.randomID();
    filter.temporary = serialized.temporary ?? false;
    return filter;
  },
  typeCheck(filter: PIXI.Filter) { return filter instanceof InvertFilter },
  fromForm(parent: HTMLElement): SerializedInvertEffect {
    return {
      ...InvertEffect.default,
      id: foundry.utils.randomID(),
      ...parseForm(parent)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
type InvertUniforms = {}

class InvertFilter extends CustomFilter<InvertUniforms> {
  constructor() {
    super(undefined, frag, {});
  }
}

const frag = `#version 300 es

precision highp float;

uniform sampler2D uSampler;
in vec2 vTextureCoord;
out vec4 color;

void main() {
  color = texture(uSampler, vTextureCoord);
  float a = color.a;
  color.rgb = (1.0 - color.rgb) * a;
  
}
`;