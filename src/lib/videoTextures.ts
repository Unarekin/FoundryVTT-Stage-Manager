import { logError } from "../logging";
import mime from "../mime";

const KNOWN_TEXTURES: Record<string, PIXI.Texture[]> = {};
const REVERSE_HASH = new WeakMap<PIXI.Texture, string>();

export function pathIsVideo(path: string): boolean {
  const mimeType = mime(path);
  const split = mimeType ? mimeType.split("/") : [];
  return split[1] === "video";
}

export function loadVideoTexture(source: string): PIXI.Texture {
  const texture = PIXI.Texture.from(source);
  if (KNOWN_TEXTURES[source]) KNOWN_TEXTURES[source].push(texture);
  else KNOWN_TEXTURES[source] = [texture];
  REVERSE_HASH.set(texture, source);

  if (texture.baseTexture.valid) {
    if (texture.baseTexture.resource instanceof PIXI.VideoResource) {
      if (texture.valid) {
        texture.baseTexture.resource.source.loop = true;
        texture.baseTexture.resource.source.play()
          .catch((err: Error) => {
            logError(err);
            unloadVideoTexture(texture);
          });
      } else {
        texture.baseTexture.once("loaded", () => {
          if (texture.baseTexture.resource instanceof PIXI.VideoResource) {
            texture.baseTexture.resource.source.loop = true;
            texture.baseTexture.resource.source.play()
              .catch((err: Error) => {
                logError(err);
              });
            unloadVideoTexture(texture);
          }

        })
      }
    }
  }

  return texture;
}

export function unloadVideoTexture(texture: PIXI.Texture) {
  const source = REVERSE_HASH.get(texture);
  if (!source) return;
  REVERSE_HASH.delete(texture);

  const index = KNOWN_TEXTURES[source].indexOf(texture);
  if (index !== -1)
    KNOWN_TEXTURES[source].splice(index,1);
  if (KNOWN_TEXTURES[source].length===0 && texture.baseTexture.resource instanceof PIXI.VideoResource)
    texture.baseTexture.resource.source.pause();

  texture.destroy();
}