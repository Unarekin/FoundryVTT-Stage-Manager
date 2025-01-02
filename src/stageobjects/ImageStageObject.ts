import { SerializedImageStageObject } from "../types";
import { StageObject } from "./StageObject";
import mime from "../mime";
import { StageManager } from "../StageManager";

export class ImageStageObject extends StageObject<PIXI.Sprite> {
  public static readonly type: string = "image";

  public get displayObject(): PIXI.Sprite { return super.displayObject; }
  public set displayObject(val) {
    if (this.displayObject) {
      const { width, height, anchor } = this.displayObject;
      val.width = width;
      val.height = height;
      val.anchor.x = anchor.x;
      val.anchor.y = anchor.y;
    }
    super.displayObject = val;
  }

  public get width() { return this.displayObject.width; }
  public set width(width) {
    this.displayObject.width = width;
    super.width = width;
  }

  public get height() { return this.displayObject.height; }
  public set height(height) {
    this.displayObject.height = height;
    super.height = height;
  }

  public scaleToScreen() {

    const effectiveBounds = this.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    const width = effectiveBounds.width * this.scaledDimensions.width;
    const height = effectiveBounds.height * this.scaledDimensions.height;

    const x = effectiveBounds.width * this.scaledDimensions.x;
    const y = effectiveBounds.height * this.scaledDimensions.y;

    this.width = width;
    this.height = height;

    this.x = x;
    this.y = y;

    this.sizeInterfaceContainer();
  }

  public get anchor() { return this.displayObject.anchor; }
  public set anchor(anchor) { this.displayObject.anchor = anchor; }

  public get texture() { return this.displayObject.texture; }


  public get scale() { return this.displayObject.scale; }

  public serialize(): SerializedImageStageObject {
    return {
      ...super.serialize(),
      type: ImageStageObject.type,
      src: this.path
    }
  }

  public destroy() {
    // Make sure we destroy the video resource so it stops playing.
    if (!this.destroyed && this.#isVideo && !this.displayObject.texture.baseTexture.resource.destroyed)
      this.displayObject.texture.baseTexture.resource.destroy();
    super.destroy();

  }

  public static deserialize(data: SerializedImageStageObject): ImageStageObject {
    const obj = new ImageStageObject(data.src, data.name);
    obj.deserialize(data);
    return obj;
  }

  public deserialize(serialized: SerializedImageStageObject): void {
    super.deserialize(serialized);
    // If the texture isn't loaded into memory, wait for it to be then set the width/height
    if (!this.displayObject.texture.baseTexture.valid) {
      this.displayObject.texture.baseTexture.once("loaded", () => {
        this.scaledDimensions.x = serialized.bounds.x;
        this.scaledDimensions.y = serialized.bounds.y;
        this.scaledDimensions.width = serialized.bounds.width;
        this.scaledDimensions.height = serialized.bounds.height;

        this.width = this.actualBounds.width * this.scaledDimensions.width;
        this.height = this.actualBounds.height * this.scaledDimensions.height;
        this.dirty = true;
      })
    }
  }

  public get animated() {
    return this.displayObject.texture.baseTexture.resource instanceof PIXI.VideoResource;
  }

  public get playing() {
    const resource = this.displayObject.texture.baseTexture.resource;
    if (resource instanceof PIXI.VideoResource) {
      return !resource.source.paused
    }
    return false;
  }

  public set playing(playing) {
    const resource = this.displayObject.texture.baseTexture.resource;
    if (resource instanceof PIXI.VideoResource) {
      if (playing) void resource.source.play();
      else void resource.source.pause();
    }
  }

  public get loop() {
    const resource = this.displayObject.texture.baseTexture.resource;
    if (resource instanceof PIXI.VideoResource) {
      return resource.source.loop
    }
    return false;
  }

  public set loop(loop) {
    const resource = this.displayObject.texture.baseTexture.resource;
    if (resource instanceof PIXI.VideoResource) {
      resource.source.loop = loop;
    }
  }

  public get volume() {
    const resource = this.displayObject.texture.baseTexture.resource;
    if (resource instanceof PIXI.VideoResource) {
      return resource.source.volume;
    }
    return 0;
  }

  public set volume(volume) {
    const resource = this.displayObject.texture.baseTexture.resource;
    if (resource instanceof PIXI.VideoResource) {
      resource.source.volume = volume;
    }
  }

  #isVideo = false;

  constructor(protected path: string, name?: string) {
    let sprite: PIXI.Sprite | null = null;


    const mimeType = mime(path);
    const split = mimeType ? mimeType.split("/") : [];

    let isVideo = false;
    if (split[0] === "video") {
      // Handle video
      isVideo = true;
      const vid = document.createElement("video");
      vid.src = path;
      vid.autoplay = true;
      vid.loop = true;
      sprite = PIXI.Sprite.from(vid);
    } else if (split[1] === "gif") {
      PIXI.Assets.load(path)
        .then(img => { this.displayObject = img as PIXI.Sprite; })
        .catch((err: Error) => {
          ui.notifications?.error(err.message, { console: false, localize: true });
          console.error(err);
        });
    }

    if (!sprite) sprite = PIXI.Sprite.from(path);
    super(sprite, name);
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.resizable = true;
    this.#isVideo = isVideo;
    this.loop = true;

    if (!this.displayObject.texture.valid) {
      this.displayObject.texture.baseTexture.once("loaded", () => {
        this.width = this.displayObject.texture.width;
        this.height = this.displayObject.texture.height;
      });
    }
  }

  public get baseWidth() { return this.displayObject.texture.width; }
  public get baseHeight() { return this.displayObject.texture.height; }

  public get left() { return this.x + this.actualBounds.left - (this.width * this.anchor.x); }
  public set left(val) {
    this.x = val + this.actualBounds.left + (this.width * this.anchor.x);
    this.updateScaledDimensions();
    this.updatePinLocations();
  }

  public get right() { return this.actualBounds.right - (this.x + (this.width * this.anchor.x)); }
  public set right(val) {
    // Set relative to right side of screen
    this.displayObject.x = this.actualBounds.right - val - (this.width * this.anchor.x);

    this.updateScaledDimensions();
    this.updatePinLocations();
  }


  public get top() { return this.y - this.actualBounds.top - (this.height * this.anchor.y); }
  public set top(val) {
    this.y = val + this.actualBounds.top + (this.height * this.anchor.y);
    this.updateScaledDimensions();
    this.updatePinLocations();
  }

  public get bottom() { return this.actualBounds.bottom - (this.y + (this.height * this.anchor.y)); }
  public set bottom(val) {
    this.displayObject.y = this.actualBounds.bottom - val - (this.height * this.anchor.y);
    this.updateScaledDimensions();
    this.updatePinLocations();
  }


  public createDragGhost(): PIXI.Sprite {
    const tex = this.displayObject.texture.clone();
    const sprite = new PIXI.Sprite(tex);
    sprite.width = this.width;
    sprite.height = this.height;
    sprite.anchor.x = this.anchor.x;
    sprite.anchor.y = this.anchor.y;
    sprite.x = this.x;
    sprite.y = this.y;
    return sprite;
  }


  public readonly type: string = "image";
}