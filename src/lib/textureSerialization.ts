import { coerceColor, coerceTexture, createColorTexture } from "../coercion";
import { InvalidTextureError } from "../errors";
import { bytesToBase64 } from "./base664Utils";

export interface TextureBuffer {
  width: number;
  height: number;
  buffer: Uint8Array;
}

export interface DataURLBuffer {
  mimeType: string;
  buffer: Uint8Array;
}

export type SerializedAsset = TextureBuffer | DataURLBuffer | string;


function dataURLToBuffer(url: string): Uint8Array {
  const binary = atob(url.split(",")[1]);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < buffer.length; i++)
    buffer[i] = binary.charCodeAt(i);
  return buffer;
}

function serializeDataURL(url: string): DataURLBuffer {
  const buffer = dataURLToBuffer(url);
  return {
    mimeType: url.split(";")[0].split(":")[1],
    buffer
  }
}

function serializeCanvas(canvas: HTMLCanvasElement): TextureBuffer {
  const buffer = dataURLToBuffer(canvas.toDataURL());
  return {
    width: canvas.width,
    height: canvas.height,
    buffer
  }
}

function isValidColor(input: unknown): boolean {
  try {
    new PIXI.Color(input as PIXI.ColorSource);
    return true;
  } catch {
    return false;
  }
}

export function backgroundType(background: PIXI.ColorSource | PIXI.TextureSource): "image" | "color" {
  if (isValidColor(background)) return "color";
  else return "image";
}

export function serializeTexture(texture: any): SerializedAsset {
  if (typeof texture === "string" && texture.startsWith("data:")) return serializeDataURL(texture);
  const color = coerceColor(texture);
  if (color instanceof PIXI.Color) return color.toHexa();

  if (typeof texture === "string") return texture;
  if (texture instanceof HTMLImageElement || texture instanceof HTMLVideoElement) return texture.src;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const coerced = new PIXI.Texture(texture);
  if (!coerced) throw new InvalidTextureError();

  const resource = coerced.baseTexture.resource;

  if (resource instanceof PIXI.VideoResource) return resource.src;
  if (resource instanceof PIXI.ImageResource) return resource.src;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  if (typeof (resource as any).data !== "undefined") return { width: resource.width, height: resource.height, buffer: (resource as any).data };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const source = (resource as any).source;
  if (source instanceof HTMLImageElement) return source.getAttribute("src")!;
  if (source instanceof HTMLCanvasElement) return serializeCanvas(source);

  throw new InvalidTextureError();
}

export function deserializeTexture(data: SerializedAsset): PIXI.Texture {
  if (typeof data === "string") return coerceTexture(data) ?? createColorTexture("transparent");

  const urlBuffer = data as DataURLBuffer;
  if (urlBuffer.buffer && urlBuffer.mimeType) return deserializeDataURL(urlBuffer);

  const textureBuffer = data as TextureBuffer;
  if (textureBuffer.buffer && textureBuffer.width && textureBuffer.height) return deserializeTextureBuffer(textureBuffer);

  throw new InvalidTextureError();
}

function deserializeTextureBuffer(data: TextureBuffer): PIXI.Texture {
  return PIXI.Texture.fromBuffer(data.buffer, data.width, data.height);
}

function deserializeDataURL(data: DataURLBuffer): PIXI.Texture {
  const base64 = bytesToBase64((data.buffer instanceof ArrayBuffer) ? new Uint8Array(data.buffer) : data.buffer);
  return PIXI.Texture.from(`data:${data.mimeType};base64,${base64}`);

}