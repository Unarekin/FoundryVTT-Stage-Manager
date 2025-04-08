import { coerceColor } from 'coercion';
import { SerializedHologramEffect } from '../types';
import { CustomFilter } from './CustomFilter';
import { Effect } from "./types";
import { InvalidColorError } from 'errors';
import { parseForm } from './functions';

export const HologramEffect: Effect<SerializedHologramEffect> = {
  type: "hologram",
  label: "HOLOGRAM",
  template: "hologram.hbs",
  default: {
    id: "",
    version: __MODULE_VERSION__,
    type: "hologram",
    noise: .5,
    alpha: .5,
    speed: .4,
    color1: "rgba(0,0,255,1)",
    color2: "rgba(255,0,0,1)",
    lines: 100
  },
  serialize(filter: HologramFilter): SerializedHologramEffect {
    return {
      ...HologramEffect.default,
      id: foundry.utils.randomID(),
      noise: filter.noise,
      alpha: filter.alpha,
      speed: filter.speed,
      color1: new PIXI.Color(filter.color1).toHexa(),
      color2: new PIXI.Color(filter.color2).toHexa()
    };
  },

  deserialize(serialized: SerializedHologramEffect): HologramFilter {
    const color1 = coerceColor(serialized.color1);
    if (!(color1 instanceof PIXI.Color)) throw new InvalidColorError(serialized.color1);
    const color2 = coerceColor(serialized.color2);
    if (!(color2 instanceof PIXI.Color)) throw new InvalidColorError(serialized.color2);

    const filter = new HologramFilter(
      serialized.noise ?? HologramEffect.default.noise,
      serialized.alpha ?? HologramEffect.default.alpha,
      serialized.speed ?? HologramEffect.default.speed,
      color1, color2
    );
    return filter;
  },
  typeCheck(filter: PIXI.Filter) { return filter instanceof HologramFilter; },

  fromForm(parent: HTMLElement): SerializedHologramEffect {
    const parsed = parseForm(parent);
    return {
      ...HologramEffect.default,
      id: foundry.utils.randomID(),
      ...parsed
    }
  }


}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type HologramUniforms = {
  noiseAmt: number,
  alpha: number,
  speed: number,
  color1: [number, number, number, number],
  color2: [number, number, number, number],
  time: number,
  lines: number
};

class HologramFilter extends CustomFilter<HologramUniforms> {


  public get alpha() { return this.uniforms.alpha as number ?? 1; }
  public set alpha(val) { this.uniforms.alpha = val; }

  public get speed() { return this.uniforms.speed as number ?? 0.4; }
  public set speed(val) { this.uniforms.speed = val; }

  public get noise() { return this.uniforms.noiseAmt as number ?? .5; }
  public set noise(val) { this.uniforms.noiseAmt = val; }

  public get color1() { return this.uniforms.color1 as string ?? HologramEffect.default.color1; }
  public set color1(val) { this.uniforms.color1 = new PIXI.Color(val).toArray() }

  public get color2() { return this.uniforms.color2 as string ?? HologramEffect.default.color2; }
  public set color2(val) { this.uniforms.color2 = new PIXI.Color(val).toArray() }

  private startTime = Date.now();
  public get time() { return this.uniforms.time as number ?? 0; }
  public set time(val) { this.uniforms.time = val; }

  public updateTime(): void {
    super.updateTime();
    this.time = (Date.now() - this.startTime) / 1000;
  }

  public get lines() { return this.uniforms.lines as number ?? 0; }
  public set lines(val) { this.uniforms.lines = val; }

  constructor(noise = .5, alpha = .5, speed = .4, color1: PIXI.ColorSource = HologramEffect.default.color1, color2: PIXI.ColorSource = HologramEffect.default.color2) {

    const color1Color = new PIXI.Color(color1);
    const color2Color = new PIXI.Color(color2);

    const uniforms: HologramUniforms = {
      noiseAmt: noise,
      alpha,
      speed,
      color1: color1Color.toArray() as [number, number, number, number],
      color2: color2Color.toArray() as [number, number, number, number],
      time: 0,
      lines: HologramEffect.default.lines
    }

    super(undefined, FRAGMENT_SHADER, uniforms);
    this.alpha = alpha;
    this.noise = noise;
    this.speed = speed;
    this.color1 = color1Color.toHexa();
    this.color2 = color2Color.toHexa();
  }
}

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uSampler;
in vec2 vTextureCoord;
out vec4 color;

uniform float noiseAmt;
uniform float alpha;
uniform float speed;
uniform vec4 color1;
uniform vec4 color2;

uniform float time;

float effect_factor = 0.4;
uniform int lines;

void noise(in vec2 uv, inout vec4 color) {
  float a = fract(sin(dot(uv, vec2(12.9898, 78.233) * time)) * 438.5453) * 1.9;
  color.rgb = mix(color.rgb, vec3(a), noiseAmt);
}

vec4 color_shift(in vec2 uv, in sampler2D image, vec2 shift_vector) {
  return texture(image, uv - shift_vector);
}

void main() {
  vec4 origColor = texture(uSampler, vTextureCoord);
  float lineN = floor((vTextureCoord.y - time * speed) * float(lines));
  float line_grade = abs(sin(lineN * 3.14/4.0));
  float smooth_line_grade = abs(sin((vTextureCoord.y - time * speed) * float(lines)));

  vec4 line_color = mix(color1, color2, line_grade);

  color = color_shift(vTextureCoord, uSampler, vec2(1.0, 0.0) * smooth_line_grade / 240.0 * effect_factor);
  noise(vTextureCoord, color);

  color.rgb = mix(color.rgb, line_color.rgb, effect_factor);

  color.a = alpha * color.a * line_color.a;
  // Premultiply
  color.r = color.r * color.a;
  color.g = color.g * color.a;
  color.b = color.b * color.a;

}

`