import { SerializedStageObject } from "../types";
import { StageObject } from "./StageObject";
import mime from "../mime";
import { StageManager } from "../StageManager";

export class ImageStageObject extends StageObject {
  public static type = "image";

  public get displayObject(): PIXI.Sprite { return this._displayObject as PIXI.Sprite; }

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

    // const width = this.restrictToVisualArea ? StageManager.VisualBounds.width : window.innerWidth;
    // const height = this.restrictToVisualArea ? StageManager.VisualBounds.height : window.innerHeight;

    // if (this.preserveAspectRatio) {
    //   const desiredWidth = this.scaledDimensions.width * width;
    //   const desiredHeight = this.scaledDimensions.height * height;

    //   const ratio = Math.min(desiredWidth / this.width, desiredHeight / this.height);
    //   const origWidth = this.width;
    //   const origHeight = this.height;
    //   this.width = this.baseWidth * ratio;
    //   this.height = this.baseHeight * ratio;


    //   console.group("Scaling");
    //   log("Base size:", this.baseWidth, this.baseHeight);
    //   log("Original size:", origWidth, origHeight);
    //   log("Desired size:", desiredWidth, desiredHeight);
    //   log("Ratio:", ratio);
    //   log("New size:", this.width, this.height)
    //   console.groupEnd();
    // } else {
    //   this.width = this.scaledDimensions.width * width;
    //   this.height = this.scaledDimensions.height * height;
    // }

    // this.x = (this.scaledDimensions.x * width);
    // this.y = (this.scaledDimensions.y * height);

    this.sizeInterfaceContainer();
  }

  public get anchor() { return this.displayObject.anchor; }
  public set anchor(anchor) { this.displayObject.anchor = anchor; }

  public get texture() { return this.displayObject.texture; }


  public get scale() { return this.displayObject.scale; }

  public serialize(): SerializedStageObject {
    const serialized = super.serialize();

    return {
      ...serialized,
      type: "image",
      data: {
        ...serialized.data,
        image: this.path,
        anchor: { x: this.anchor.x, y: this.anchor.y },
        width: this.width,
        height: this.height
      }
    }

  }

  public deserialize(serialized: SerializedStageObject) {
    super.deserialize(serialized);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.anchor.x = (serialized.data.anchor as any)?.x as number ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.anchor.y = (serialized.data.anchor as any)?.y as number ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.width = (serialized.data.dimensions as any)?.width as number * window.innerWidth;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.height = (serialized.data.dimensions as any)?.height as number * window.innerHeight;

  }

  public static deserialize(data: SerializedStageObject): ImageStageObject {
    const obj = new ImageStageObject(data.data.image as string, data.data.name as string);
    obj.deserialize(data);

    return obj;
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
  constructor(protected path: string, name?: string) {
    let sprite: PIXI.Sprite | null = null;


    const mimeType = mime(path);
    const split = mimeType.split("/");

    if (split[0] === "video") {
      // Handle video
      const vid = document.createElement("video");
      vid.src = path;
      vid.autoplay = true;
      vid.loop = true;
      sprite = PIXI.Sprite.from(vid);
    }

    if (!sprite) sprite = PIXI.Sprite.from(path);
    super(sprite, name);
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.resizable = true;

  }

  public get baseWidth() { return this.displayObject.texture.width; }
  public get baseHeight() { return this.displayObject.texture.height; }

  public get right() { return this.x + (this.width * this.anchor.x) }
  public set right(right) { super.right = right; }

  public get bottom() { return this.y + (this.height * this.anchor.y); }
  public set bottom(bottom) { super.bottom = bottom; }

  public get left() { return this.x - (this.width * this.anchor.x); }
  public set left(left) { super.left = left; }

  public get top() { return this.y - (this.height * this.anchor.y); }
  public set top(top) { super.top = top; }
}