import { SerializedChromaKeyEffect } from '../types';
import { Effect } from "./types";
import { parseForm } from "./functions";
import { CustomFilter } from "./CustomFilter";
import { createColorTexture, coerceTexture, coerceColor } from "../coercion";
import { backgroundType, deserializeTexture, SerializedAsset, serializeTexture } from '../lib/textureSerialization';
import { InvalidTextureError } from '../errors';

export const ChromaKeyEffect: Effect<SerializedChromaKeyEffect> = {
  type: "chromakey",
  label: "CHROMAKEY",
  template: "chromakey.hbs",
  default: {
    id: "",
    type: "chromakey",
    version: __MODULE_VERSION__,
    backgroundType: "color",
    backgroundColor: "#00000000",
    keyColor: "#00B140",
    range: [.11, .22],
    temporary: false
  },
  serialize(filter: ChromaKeyFilter): SerializedChromaKeyEffect {
    return {
      ...ChromaKeyEffect.default,
      id: filter.id,
      backgroundType: filter.backgroundType,
      ...(filter.backgroundType === "image" ? { backgroundImage: filter.background, backgroundColor: "" } : { backgroundColor: filter.background as string, backgroundImage: "" }),
      keyColor: new PIXI.Color(filter.keyRGBA).toHexa(),
      range: filter.range,
      temporary: filter.temporary ?? false
    }
  },
  deserialize(serialized: SerializedChromaKeyEffect): ChromaKeyFilter {

    let bg: PIXI.ColorSource | PIXI.TextureSource = "#00000000";
    if (serialized.backgroundType === "color") {
      const color = coerceColor(serialized.backgroundColor);
      if (!color) throw new InvalidTextureError();
      bg = color.toHexa();
    } else {
      if (typeof serialized.backgroundImage === "string") {
        bg = serialized.backgroundImage;
      } else if (serialized.backgroundImage) {
        const texture = deserializeTexture(serialized.backgroundImage);
        if (!texture) throw new InvalidTextureError();
        bg = texture.baseTexture;
      }
    }


    const filter = new ChromaKeyFilter(
      serialized.keyColor,
      serialized.range,
      bg
    )
    filter.id = serialized.id;
    filter.temporary = serialized.temporary ?? false;
    return filter;
  },
  typeCheck(filter: PIXI.Filter) { return filter instanceof ChromaKeyFilter; },
  fromForm(parent: HTMLElement): SerializedChromaKeyEffect {
    const parsed = parseForm(parent);


    const bgImage = parent.querySelector(`[name="effect.backgroundImage"] input[type="text"]`);
    if (bgImage instanceof HTMLInputElement) {
      parsed.backgroundImage = bgImage.value;
    }

    return {
      ...this.default,
      id: foundry.utils.randomID(),
      ...parsed
    }
  }

}


// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type ChromaKeyUniforms = {
  keyRGBA: [number, number, number, number],
  keyCC: [number, number],
  range: [number, number],
  uBgSampler: PIXI.Texture,
  bgScale: [number, number]
}

function rgbaToCC(r: number, g: number, b: number): [number, number] {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  return [(b - y) * 0.565, (r - y) * 0.713];
}

class ChromaKeyFilter extends CustomFilter<ChromaKeyUniforms> {
  public readonly keyRGBA: [number, number, number, number];
  public readonly keyCC: [number, number];
  public readonly range: [number, number];
  public readonly backgroundType: "color" | "image";
  public readonly background: SerializedAsset;

  private bgSize: [number, number] = [0, 0];

  public setBgScale(width: number, height: number): void {
    if (this.backgroundType === "color") {
      this.uniforms.bgScale = [1, 1];
    } else {
      this.uniforms.bgScale = [
        width / this.bgSize[0],
        height / this.bgSize[1]
      ];
    }
  }

  constructor(keyColor: PIXI.ColorSource = [0.05, 0.63, 0.14, 1], range: [number, number] = [0.11, 0.22], bg: PIXI.ColorSource | PIXI.TextureSource = "transparent") {
    const color = new PIXI.Color(keyColor);
    const keyCC = rgbaToCC(color.red, color.green, color.blue);



    const bgSampler = coerceTexture(bg) ?? createColorTexture("transparent");
    const uniforms: ChromaKeyUniforms = {
      keyRGBA: [color.red, color.green, color.blue, 1],
      keyCC,
      range,
      uBgSampler: bgSampler,
      bgScale: [1, 1]
    };


    super(undefined, FRAGMENT_SHADER, uniforms);
    this.keyRGBA = uniforms.keyRGBA;
    this.keyCC = uniforms.keyCC;
    this.range = uniforms.range;
    this.backgroundType = backgroundType(bg);

    if (this.backgroundType === "color") {
      const bgColor = coerceColor(bg);
      if (bgColor) this.background = bgColor.toHexa();
      else throw new InvalidTextureError();
    } else {
      this.background = serializeTexture(bg);
      this.bgSize = [bgSampler.width, bgSampler.height];
    }
  }
}

const FRAGMENT_SHADER = `#version 300 es

precision highp float;

uniform sampler2D uSampler;
in vec2 vTextureCoord;
out vec4 color;
uniform sampler2D uBgSampler;

uniform vec4 keyRGBA;
uniform vec2 keyCC;
uniform vec2 range;
uniform vec2 bgScale;

vec2 RGBToCC(vec4 rgba) {
    float Y = 0.299 * rgba.r + 0.587 * rgba.g + 0.114 * rgba.b;
    return vec2((rgba.b - Y) * 0.565, (rgba.r - Y) * 0.713);
}

void main() {
    vec4 src1Color = texture(uSampler, vTextureCoord.xy);
    vec2 CC = RGBToCC(src1Color);

    float mask = sqrt(pow(keyCC.x - CC.x, 2.0) + pow(keyCC.y - CC.y, 2.0));
    mask = smoothstep(range.x, range.y, mask);

    if (mask == 0.0) color = texture(uBgSampler, vTextureCoord.xy / bgScale);
    else if (mask == 1.0) color = src1Color;
    else color = max(src1Color - (1.0 - mask) * keyRGBA, 0.0);
}`;