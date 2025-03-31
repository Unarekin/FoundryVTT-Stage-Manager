import { SerializedImageStageObject } from "../types";
import { StageObject } from "./StageObject";
import mime from "../mime";
import { logError } from "../logging";

const VIDEO_OBJECTS: Record<string, ImageStageObject[]> = {};

export class ImageStageObject extends StageObject<PIXI.Sprite> {
  // #region Properties (3)
  private _path: string;
  public get path() { return this._path; }
  public set path(val) {
    if (this.path !== val) {
      this._path = val;
      this.cleanVideoTexture();
      const texture = PIXI.Texture.from(val);

      if (texture.baseTexture.resource instanceof PIXI.VideoResource) {
        const resource = texture.baseTexture.resource;
        if (texture.valid) {
          resource.source.loop = true;
          resource.source.play()
            .catch((err: Error) => { logError(err); });
        } else {
          texture.baseTexture.once("loaded", () => {
            resource.source.loop = true;
            resource.source.play()
              .catch((err: Error) => { logError(err); });
          });
        }

        if (VIDEO_OBJECTS[val]) VIDEO_OBJECTS[val].push(this);
        else VIDEO_OBJECTS[val] = [this];
      }


      // game.video?.play(this.displayObject.texture);

      this.dirty = true;
    }
  }

  protected pathIsVideo(path: string): boolean {
    return pathIsVideo(path);
  }

  protected pathIsGif(path: string): boolean {
    return pathIsGif(path);
  }

  public static readonly type: string = "image";

  public readonly type: string = "image";

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(path: string, name?: string) {
    let sprite: PIXI.Sprite | null = null;

    let isVideo = false;

    if (pathIsVideo(path)) {
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

    } else if (pathIsGif(path)) {
      PIXI.Assets.load(path)
        .then(img => { this.displayObject = img as PIXI.Sprite; })
        .catch((err: Error) => {
          logError(err);
        });
    }

    if (!sprite) sprite = PIXI.Sprite.from(path);
    super(sprite, name);
    // this.anchor.x = 0.5;
    // this.anchor.y = 0.5;
    this.resizable = true;
    this.loop = true;
    this._path = path;

    if (isVideo) {
      if (VIDEO_OBJECTS[path]) VIDEO_OBJECTS[path].push(this);
      else VIDEO_OBJECTS[path] = [this];
    }

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
      // this.updateScaledDimensions();
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
      if (!this.displayObject.texture.valid) {
        this.displayObject.texture.baseTexture.once("loaded", () => { this.height = height; });
      } else {
        this.displayObject.height = height;
        super.height = height;
        this.dirty = true;
      }
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
      // this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get center(): PIXI.Point {
    return new PIXI.Point(
      this.x + (this.width * this.anchor.x),
      this.y + (this.height * this.anchor.y)
    );
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

      // this.updateScaledDimensions();
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
      // this.updateScaledDimensions();
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
      if (!this.displayObject.texture.valid) {
        this.displayObject.texture.baseTexture.once("loaded", () => { this.width = width; });
      } else {
        this.displayObject.width = width;
        super.width = width;
        this.dirty = true;
      }
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
        this.path = serialized.src;
        // this.loop = serialized.loop;
        this.width = this.actualBounds.width * serialized.bounds.width;
        this.height = this.actualBounds.height * serialized.bounds.height;
      });
    } else {
      this.path = serialized.src;
      // this.loop = serialized.loop;
      this.width = this.actualBounds.width * serialized.bounds.width;
      this.height = this.actualBounds.height * serialized.bounds.height;
    }
    this.dirty = true;
    if (typeof serialized.anchor !== "undefined") {
      if (typeof serialized.anchor.x !== "undefined") this.anchor.x = serialized.anchor.x;
      if (typeof serialized.anchor.y !== "undefined") this.anchor.y = serialized.anchor.y;
    }
  }

  public destroy() {
    // // Make sure we destroy the video resource so it stops playing.
    // if (!this.destroyed && this.#isVideo && !this.displayObject.texture.baseTexture.resource.destroyed)
    //   this.displayObject.texture.baseTexture.resource.destroy();
    super.destroy();
    this.cleanVideoTexture();
  }

  protected cleanVideoTexture() {
    if (VIDEO_OBJECTS[this.path]) {
      const index = VIDEO_OBJECTS[this.path].indexOf(this);
      if (index !== -1)
        VIDEO_OBJECTS[this.path].splice(index, 1);
      // Pause the video if it is no longer being used.
      if (!VIDEO_OBJECTS[this.path].length && this.displayObject.texture.baseTexture?.resource instanceof PIXI.VideoResource)
        this.displayObject.texture.baseTexture.resource.source.pause();
    }
  }

  public scaleToScreen() {
    // const effectiveBounds = this.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    // const width = effectiveBounds.width * this.scaledDimensions.width;
    // const height = effectiveBounds.height * this.scaledDimensions.height;

    // const x = effectiveBounds.width * this.scaledDimensions.x;
    // const y = effectiveBounds.height * this.scaledDimensions.y;

    // this.width = width;
    // this.height = height;

    // this.x = x;
    // this.y = y;

    this.sizeInterfaceContainer();
  }

  public textureLoaded(): Promise<void> {
    return new Promise(resolve => {
      if (this.texture.valid) {
        resolve();
      } else {
        this.texture.baseTexture.once("loaded", () => { resolve(); });
      }
    })
  }


  public serialize(): SerializedImageStageObject {
    return {
      ...super.serialize(),
      type: ImageStageObject.type,
      src: this.path,
      // playing: this.playing,
      loop: this.loop,
      anchor: {
        x: this.anchor.x,
        y: this.anchor.y
      }
    }
  }
}

function pathIsVideo(path: string): boolean {
  const mimeType = mime(path);
  const split = mimeType ? mimeType.split("/") : [];
  return split[1] === "video";
}

function pathIsGif(path: string): boolean {
  return mime(path) === "image/gif";
}