import { SerializedImageStageObject } from "../types";
import { StageObject } from "./StageObject";
import mime from "../mime";
import { StageManager } from "../StageManager";

export class ImageStageObject extends StageObject<PIXI.Sprite> {
  // #region Properties (3)

  #isVideo = false;
  private _path: string;
  public get path() { return this._path; }
  public set path(val) {
    if (this.path !== val) {
      this._path = val;
      this.displayObject.texture = PIXI.Texture.from(val);
      this.dirty = true;
    }
  }

  public static readonly type: string = "image";

  public readonly type: string = "image";

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(path: string, name?: string) {
    let sprite: PIXI.Sprite | null = null;

    const mimeType = mime(path);
    const split = mimeType ? mimeType.split("/") : [];

    let isVideo = false;
    if (split[0] === "video") {
      // Handle video
      isVideo = true;
      const vid = document.createElement("video");
      vid.src = path;
      // vid.autoplay = true;
      // vid.loop = true;
      game.video?.play(vid);
      if (game.video?.locked) {
        sprite = PIXI.Sprite.from(path);
        vid.onplay = () => {
          this.displayObject = PIXI.Sprite.from(vid);
          // if (sprite) sprite.destroy();
        }
      } else {
        sprite = PIXI.Sprite.from(vid);
      }

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
    // this.anchor.x = 0.5;
    // this.anchor.y = 0.5;
    this.resizable = true;
    this.#isVideo = isVideo;
    this.loop = true;
    this._path = path;

    if (!this.displayObject.texture.valid) {
      this.displayObject.texture.baseTexture.once("loaded", () => {
        this.width = this.displayObject.texture.width;
        this.height = this.displayObject.texture.height;
        // this.createRenderTexture();
      });
    }
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (27)

  public get anchor() { return this.displayObject.anchor; }

  public set anchor(anchor) { this.displayObject.anchor = anchor; }

  public get animated() {
    return this.displayObject.texture.baseTexture.resource instanceof PIXI.VideoResource;
  }

  public get baseHeight() { return this.displayObject.texture.height; }

  public get baseWidth() { return this.displayObject.texture.width; }

  public get bottom() { return this.actualBounds.bottom - (this.y + (this.height * this.anchor.y)); }

  public set bottom(val) {
    if (this.bottom !== val) {
      this.displayObject.y = this.actualBounds.bottom - val - (this.height * this.anchor.y);
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get displayObject(): PIXI.Sprite { return super.displayObject; }

  public set displayObject(val) {
    if (this.displayObject != val) {
      if (this.displayObject) {
        const { width, height, anchor } = this.displayObject;
        val.width = width;
        val.height = height;
        val.anchor.x = anchor.x;
        val.anchor.y = anchor.y;
      }
      super.displayObject = val;
      this.dirty = true;
    }
  }

  public get height() { return this.displayObject.height; }

  public set height(height) {
    if (this.height !== height) {
      this.displayObject.height = height;
      super.height = height;
    }
  }

  protected getLocalCoordinates(clientX: number, clientY: number): { x: number; y: number; } {
    const { x, y } = this.displayObject.toLocal({ x: clientX + (this.width * this.anchor.x), y: clientY + (this.height * this.anchor.y) });
    return { x, y };
  }

  public get left() { return this.x + this.actualBounds.left - (this.width * this.anchor.x); }

  public set left(val) {
    if (this.left !== val) {
      this.x = val + this.actualBounds.left + (this.width * this.anchor.x);
      this.updateScaledDimensions();
      this.updatePinLocations();
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
    if (this.loop !== loop) {
      const resource = this.displayObject.texture.baseTexture.resource;
      if (resource instanceof PIXI.VideoResource) {
        resource.source.loop = loop;
      }
      this.dirty = true;
    }
  }


  public get right() { return this.actualBounds.right - (this.x + (this.width * this.anchor.x)); }

  public set right(val) {
    if (this.right !== val) {
      // Set relative to right side of screen
      this.displayObject.x = this.actualBounds.right - val - (this.width * this.anchor.x);
      this.dirty = true;

      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get scale() { return this.displayObject.scale; }

  public get texture() { return this.displayObject.texture; }

  public get top() { return this.y - this.actualBounds.top - (this.height * this.anchor.y); }

  public set top(val) {
    if (this.top !== val) {
      this.y = val + this.actualBounds.top + (this.height * this.anchor.y);
      this.dirty = true;
      this.updateScaledDimensions();
      this.updatePinLocations();
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
    if (this.volume !== volume) {
      const resource = this.displayObject.texture.baseTexture.resource;
      if (resource instanceof PIXI.VideoResource) {
        resource.source.volume = volume;
      }
      this.dirty = true;
    }
  }


  public get width() { return this.displayObject.width; }

  public set width(width) {
    if (this.width !== width) {
      this.displayObject.width = width;
      super.width = width;
      this.dirty = true;
    }
  }

  // #endregion Public Getters And Setters (27)

  // #region Public Static Methods (1)

  public static deserialize(data: SerializedImageStageObject): ImageStageObject {
    const obj = new ImageStageObject(data.src, data.name);
    obj.deserialize(data);
    return obj;
  }

  // #endregion Public Static Methods (1)

  // #region Public Methods (5)

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
        // this.createRenderTexture();
      });
    } else {
      this.path = serialized.src;
      // this.playing = serialized.playing;
      this.loop = serialized.loop;
    }
    this.dirty = true;
  }

  public destroy() {
    // Make sure we destroy the video resource so it stops playing.
    if (!this.destroyed && this.#isVideo && !this.displayObject.texture.baseTexture.resource.destroyed)
      this.displayObject.texture.baseTexture.resource.destroy();
    super.destroy();
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

  public serialize(): SerializedImageStageObject {
    return {
      ...super.serialize(),
      type: ImageStageObject.type,
      src: this.path,
      // playing: this.playing,
      loop: this.loop,
    }
  }
}