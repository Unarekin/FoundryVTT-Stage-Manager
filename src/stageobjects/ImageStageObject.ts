import { SerializedImageStageObject } from "../types";
import { StageObject } from "./StageObject";
import mime from "../mime";
import { logError } from "../logging";
import { ImageStageObjectApplication, StageObjectApplication } from "applications";

const VIDEO_OBJECTS: Record<string, ImageStageObject[]> = {};

export class ImageStageObject extends StageObject<PIXI.Sprite> {
  // #region Properties (3)

  public static readonly ApplicationType: typeof StageObjectApplication = ImageStageObjectApplication as typeof StageObjectApplication;
  public readonly ApplicationType = ImageStageObject.ApplicationType;

  private _path: string;
  public get path() { return this._path; }
  public set path(val) {
    if (this.path !== val) {
      this._path = val;
      const texture = PIXI.Texture.from(val);
      if (!texture.valid) {
        texture.baseTexture.once("loaded", () => {
          this.displayObject.texture = texture;
          this.dirty = true;
        });
      } else {
        this.displayObject.texture = texture;
        this.dirty = true;
      }
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

    const origCb = this.scale.cb;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const temp = this;

    const lastScale = { x: this.scale.x, y: this.scale.y };

    this.scale.cb = function (this: PIXI.Transform) {

      // If scale axes have swapped signs, invert the object's anchor for that axis
      if ((lastScale.x * this.scale.x) < 0) temp.anchor.x = 1 - temp.anchor.x;
      if ((lastScale.y * this.scale.y) < 0) temp.anchor.y = 1 - temp.anchor.y;

      lastScale.x = this.scale.x;
      lastScale.y = this.scale.y;

      origCb.call(this.scale.scope);
    }

    const origAnchorCb = this.anchor.cb;
    this.anchor.cb = function (this: PIXI.Sprite) {
      temp.updateMaskObject();
      origAnchorCb.call(this.anchor.scope);
    }

  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (27)

  /**
   * The distance from the top of the screen to the top edge of this object.
   * 
   * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the top of the visual bounds, instead.
   */
  public get top() { return this.y + this.actualBounds.top - (this.height * this.anchor.y); }
  public set top(val) { this.y = this.actualBounds.top + val + (this.height * this.anchor.y); }

  /**
   * The distance from the left side of the screen to the left-most edge of this object
   * 
   * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the left of the visual bounds, instead.
   */
  public get left() { return this.x - this.actualBounds.left - (this.width * this.anchor.x); }
  public set left(val) { this.x = val + this.actualBounds.left + (this.width * this.anchor.x); }

  /**
   * The distance from the left side of the screen to the right-most edge of this object.
   * 
   * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the left of the visual bounds, instead.
   */
  public get right() { return this.x + this.actualBounds.left + (this.width * (1 - this.anchor.x)); }
  public set right(val) { this.x = val + this.actualBounds.left - (this.width * (1 - this.anchor.x)); }

  /**
   * The distance from the top of the screen to the bottom-most edge of the object.
   * 
   * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the top of the visual bounds, instead.
   */
  public get bottom() { return this.y - this.actualBounds.top + (this.height * (1 - this.anchor.y)); }
  public set bottom(val) { this.y = val + this.actualBounds.top - (this.height * (1 - this.anchor.y)); }

  public get center(): PIXI.Point {
    return new PIXI.Point(
      this.x + (this.width * (.5 - this.anchor.x)),
      this.y + (this.height * (.5 - this.anchor.y))
    );
  }
  public set center(val: PIXI.Point) {
    this.x = val.x + this.actualBounds.left - (this.width * (.5 - this.anchor.x));
    this.y = val.y + this.actualBounds.top - (this.height * (.5 - this.anchor.y));
  }

  public get anchor() { return this.displayObject.anchor; }

  public set anchor(anchor) {
    this.displayObject.anchor = anchor;
  }

  public get animated() {
    return this.displayObject.texture.baseTexture.resource instanceof PIXI.VideoResource;
  }

  public get baseHeight() { return this.displayObject.texture.height; }

  public get baseWidth() { return this.displayObject.texture.width; }



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
        this.updateMaskObject();
        this.dirty = true;
      }
    }
  }

  protected getLocalCoordinates(clientX: number, clientY: number): { x: number; y: number; } {
    const { x, y } = this.displayObject.toLocal({ x: clientX + (this.width * this.anchor.x), y: clientY + (this.height * this.anchor.y) });
    return { x, y };
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


  public get scale() { return this.displayObject.scale; }

  public get texture() { return this.displayObject.texture; }



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
        this.updateMaskObject();
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

  protected updateMaskObject() {
    super.updateMaskObject();
    if (this._maskObj) {
      this._maskObj.anchor.x = this.anchor.x;
      this._maskObj.anchor.y = this.anchor.y;
    }
  }

  public deserialize(serialized: SerializedImageStageObject): void {
    super.deserialize(serialized);
    // If the texture isn't loaded into memory, wait for it to be then set the width/height

    if (serialized.src) this.path = serialized.src;

    void this.textureLoaded().then(() => {
      if (typeof serialized.bounds !== "undefined") {
        this.width = this.actualBounds.width * serialized.bounds.width;
        this.height = this.actualBounds.height * serialized.bounds.height;

        if (serialized.bounds.width < 0) this.scale.x *= -1;
        if (serialized.bounds.height < 0) this.scale.y *= -1;
      }
      this.updateMaskObject();
    });

    if (typeof serialized.anchor !== "undefined") {
      if (typeof serialized.anchor.x !== "undefined") this.anchor.x = serialized.anchor.x;
      if (typeof serialized.anchor.y !== "undefined") this.anchor.y = serialized.anchor.y;
    }

    if (typeof serialized.tint !== "undefined") this.tint = serialized.tint;
    if (typeof serialized.blendMode !== "undefined") this.blendMode = serialized.blendMode;

    this.dirty = true;
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

  public get tint() { return this.displayObject.tint; }
  public set tint(val) {
    if (this.tint != val) {
      this.displayObject.tint = val;
      this.dirty = true;
    }
  }

  public get blendMode() { return this.displayObject.blendMode; }
  public set blendMode(val) {
    if (this.blendMode !== val) {
      this.displayObject.blendMode = val;
      this.dirty = true;
    }
  }

  public serialize(): SerializedImageStageObject {
    const serialized = super.serialize();
    return {
      ...serialized,
      type: ImageStageObject.type,
      src: this.path,
      // playing: this.playing,
      loop: this.loop,
      tint: new PIXI.Color(this.tint).toHex(),
      blendMode: this.displayObject.blendMode,
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