import { log } from "logging";
import mime from "../mime";

const VIDEO_TEXTURES: Record<string, PIXI.Texture[]> = {};

export function pathIsVideo(path: string): boolean {
  const mimeType = mime(path);
  const split = mimeType ? mimeType.split("/") : [];
  return split[0] === "video";
}


function playTexture(texture: PIXI.Texture) {
  if (texture.baseTexture.resource instanceof PIXI.VideoResource) {
    texture.baseTexture.resource.source.loop = true;
    if (game?.audio?.locked) {
      void game.audio.awaitFirstGesture().then(() => {
        if (texture.baseTexture.resource instanceof PIXI.VideoResource)
          return texture.baseTexture.resource.source.play();
      });
    } else {
      void texture.baseTexture.resource.source.play();
    }
  }
}


export function loadVideoTexture(source: string): PIXI.Texture {
  const texture = PIXI.Texture.from(source);
  if (Array.isArray(VIDEO_TEXTURES[source])) VIDEO_TEXTURES[source].push(texture);
  else VIDEO_TEXTURES[source] = [texture];



  if (!texture.valid) {
    texture.baseTexture.once("loaded", () => { void playTexture(texture); });
  } else {
    void playTexture(texture);
  }
  return texture;
}

export function unloadVideoTexture(source: string, texture: PIXI.Texture) {
  log("Unloading:", source, VIDEO_TEXTURES);
  if (Array.isArray(VIDEO_TEXTURES[source])) {
    const index = VIDEO_TEXTURES[source].indexOf(texture);
    if (index !== -1) VIDEO_TEXTURES[source].splice(index, 1);

    log("Textures:", VIDEO_TEXTURES[source]);

    // No more textures using this video, pause it
    if (VIDEO_TEXTURES[source].length === 0 && texture.baseTexture?.resource instanceof PIXI.VideoResource)
      texture.baseTexture.resource.source.pause();
  }
}


export function pathIsGif(path: string) {
  const mimeType = mime(path);
  return mimeType.split("/")[1] === "gif";
}