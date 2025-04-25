import { SerializedImageStageObject } from "../types";
import { StageObject } from "./StageObject";
import { pathIsVideo, pathIsGif, unloadVideoTexture, loadVideoTexture } from "lib/videoTextures";
import { log, logError } from "../logging";
import { ImageStageObjectApplication, StageObjectApplication } from "applications";


export class ImageStageObject extends StageObject<PIXI.Sprite> {
  // #region Properties (3)

  public static readonly ApplicationType: typeof StageObjectApplication = ImageStageObjectApplication as typeof StageObjectApplication;
  public readonly ApplicationType = ImageStageObject.ApplicationType;

  private _path: string;
  public get path() { return this._path; }
  public set path(val) {
    if (this.path !== val) {


      if (pathIsVideo(this.path))
        unloadVideoTexture(this.path, this.texture);

      this._path = val;


      if (pathIsVideo(val)) {
        this.displayObject.texture = loadVideoTexture(val);
      } else if (pathIsGif(val)) {
        // const { width, height, tint, alpha, blendMode, anchor } = this;
        PIXI.Assets.load(val)
          .then((img: PIXI.Sprite) => {
            if (!img.texture.valid)
              return new Promise<PIXI.Sprite>(resolve => { this.texture.baseTexture.once("loaded", () => { resolve(img); }) });
            else return Promise.resolve(img);
          })
          .then((img: PIXI.Sprite) => { this.displayObject = img; })
          .catch((err: Error) => {
            logError(err);
          });
      } else {
        this.displayObject.texture = PIXI.Texture.from(val);
      }

      this.dirty = true;
    }
  }


  public static readonly type: string = "image";

  public readonly type: string = "image";

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(path: string, name?: string) {
    const sprite = pathIsVideo(path) ? new PIXI.Sprite(loadVideoTexture(path)) : PIXI.Sprite.from(path);
    if (pathIsGif(path)) {
      PIXI.Assets.load(path)
        .then((img: PIXI.Sprite) => {
          this.displayObject = img;
        })
        .catch((err: Error) => { logError(err); })
    }

    super(sprite, name);



    // this.anchor.x = 0.5;
    // this.anchor.y = 0.5;
    this.resizable = true;
    this.loop = true;
    this._path = path;


    if (pathIsVideo(path)) {
      // if (Array.isArray(VIDEO_OBJECTS[path])) VIDEO_OBJECTS[path].push(this);
      // else VIDEO_OBJECTS[path] = [this];
      // log("Added video object:", VIDEO_OBJECTS);
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
  public get top() { return this.y - this.actualBounds.top - (this.height * this.anchor.y); }
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
  public get right() { return this.x - this.actualBounds.left + (this.width * (1 - this.anchor.x)); }
  public set right(val) { this.x = val + this.actualBounds.left - (this.width * (1 - this.anchor.x)); }

  //public get right() { return this.x - this.actualBounds.left + this.width; }

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
    if (this.displayObject != val && val) {

      if (this.displayObject) {
        const { width, height, anchor } = this.displayObject;
        if (!val.transform) {
          log("No transform?");
        } else {
          val.width = width;
          val.height = height;
          val.anchor.x = anchor.x;
          val.anchor.y = anchor.y;
        }
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
    unloadVideoTexture(this.path, this.texture);
    if (pathIsGif(this.path)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (this.displayObject as any).visible = false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (typeof (this.displayObject as any).stop === "function") (this.displayObject as any).stop();
    }
    super.destroy();

  }

  // public scaleToScreen() {
  //   // const effectiveBounds = this.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

  //   // const width = effectiveBounds.width * this.scaledDimensions.width;
  //   // const height = effectiveBounds.height * this.scaledDimensions.height;

  //   // const x = effectiveBounds.width * this.scaledDimensions.x;
  //   // const y = effectiveBounds.height * this.scaledDimensions.y;

  //   // this.width = width;
  //   // this.height = height;

  //   // this.x = x;
  //   // this.y = y;

  //   this.sizeInterfaceContainer();
  // }

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
