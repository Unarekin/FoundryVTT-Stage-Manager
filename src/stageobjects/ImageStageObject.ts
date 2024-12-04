import { SerializedStageObject } from "../types";
import { StageObject } from "./StageObject";
import mime from "../mime";

export class ImageStageObject extends StageObject {
  public static type = "image";

  public get displayObject(): PIXI.Sprite { return this._displayObject as PIXI.Sprite; }

  public get width() { return this.displayObject.width; }
  public set width(width) { this.displayObject.width = width; }

  public get height() { return this.displayObject.height; }
  public set height(height) { this.displayObject.height = height; }

  public get anchor() { return this.displayObject.anchor; }
  public set anchor(anchor) { this.displayObject.anchor = anchor; }

  public get texture() { return this.displayObject.texture; }

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
    this.width = serialized.data.width as number ?? this.texture.width;
    this.height = serialized.data.height as number ?? this.texture.height;
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

  }

  protected get top() { return this.y - (this.height * this.anchor.y); }
  protected get left() { return this.x - (this.width * this.anchor.x); }
  protected get right() { return this.x + (this.width * this.anchor.x); }
  protected get bottom() { return this.y + (this.width * this.anchor.y); }
}