import { SerializedPanelStageObject } from "../types";
import { StageObject } from "./StageObject";

export class PanelStageObject extends StageObject<PIXI.NineSlicePlane> {
  public static readonly type: string = "panel";
  public readonly type: string = "panel";


  public get borders() { return { left: this.displayObject.leftWidth, right: this.displayObject.rightWidth, top: this.displayObject.topHeight, bottom: this.displayObject.bottomHeight } }

  private _imageSrc = "";
  public get src() { return this._imageSrc; }
  public set src(val) {
    if (val !== this.src) {
      this.dirty = true;
      this._imageSrc = val;
      this.displayObject.texture = PIXI.Texture.from(val);
      if (!this.displayObject.texture.valid) {
        this.displayObject.texture.baseTexture.once("loaded", () => {
          this.width = this.displayObject.texture.width;
          this.height = this.displayObject.texture.height;
          // this.createRenderTexture();
        });
      }
    }
  }

  // protected get contextMenuItems(): ContextMenuEntry[] {
  //   return [];
  // }

  public static deserialize(data: SerializedPanelStageObject) {
    const { left, right, top, bottom } = data.borders;
    const panel = new PanelStageObject(data.src, left, right, top, bottom);
    panel.deserialize(data);
    return panel;
  }

  public deserialize(serialized: SerializedPanelStageObject) {
    super.deserialize(serialized);

  }

  public serialize(): SerializedPanelStageObject {
    return {
      ...super.serialize(),
      type: PanelStageObject.type,
      src: this.src,
      borders: { ...this.borders }
    }
  }



  public createDragGhost(): PIXI.NineSlicePlane {
    const tex = this.displayObject.texture.clone();
    const { left, right, top, bottom } = this.borders;
    const panel = new PIXI.NineSlicePlane(tex, left, right, top, bottom);
    panel.width = this.width;
    panel.height = this.height;
    panel.x = this.x;
    panel.y = this.y;
    panel.pivot.x = this.pivot.x;
    panel.pivot.y = this.pivot.y;
    return panel;
  }

  protected updatePivot() {
    this.pivot.x = this.width / 2;
    this.pivot.y = this.height / 2;
  }

  public get width() { return this.displayObject.width; }
  public set width(val) {
    if (val !== this.width) {
      this.dirty = true;
      this.displayObject.width = val;
      this.updateScaledDimensions();
      this.updatePivot();
    }
  }

  public get height() { return this.displayObject.height; }
  public set height(val) {
    if (val !== this.height) {
      this.dirty = true;
      this.displayObject.height = val;
      this.updateScaledDimensions();
      this.updatePivot();
    }
  }

  public get left() { return this.x + this.actualBounds.left - this.pivot.x; }

  public set left(val) {
    if (this.left !== val) {
      this.x = val + this.actualBounds.left + (this.width * this.pivot.x);
      this.updateScaledDimensions();
      this.updatePinLocations();
      this.updatePivot()
    }
  }

  public get right() { return this.actualBounds.right - (this.x + this.pivot.x); }

  public set right(val) {
    if (this.right !== val) {
      // Set relative to right side of screen
      this.displayObject.x = this.actualBounds.right - val - this.pivot.x;
      this.dirty = true;

      this.updateScaledDimensions();
      this.updatePinLocations();
      this.updatePivot();
    }
  }

  public get top() { return this.y - this.actualBounds.top - this.pivot.y; }

  public set top(val) {
    if (this.top !== val) {
      this.y = val + this.actualBounds.top + this.pivot.y;
      this.dirty = true;
      this.updateScaledDimensions();
      this.updatePinLocations();
      this.updatePivot();
    }
  }

  public get bottom() { return this.actualBounds.bottom - (this.y + this.pivot.y); }

  public set bottom(val) {
    if (this.bottom !== val) {
      this.displayObject.y = this.actualBounds.bottom - val - this.pivot.y;
      this.updateScaledDimensions();
      this.updatePinLocations();
      this.updatePivot();
    }
  }

  public get baseWidth() { return this.displayObject.texture.width; }
  public get baseHeight() { return this.displayObject.texture.height; }



  constructor(image: string, left: number, right: number, top: number, bottom: number)
  constructor(image: string, vertical: number, horizontal: number)
  constructor(image: string, ...sizes: number[]) {
    const left = sizes[0];
    const right = sizes.length === 4 ? sizes[1] : sizes[0];
    const top = sizes.length === 4 ? sizes[2] : sizes[1];
    const bottom = sizes.length === 4 ? sizes[3] : sizes[1];

    const panel = new PIXI.NineSlicePlane(PIXI.Texture.from(image), left, right, top, bottom);
    super(panel);
    this._imageSrc = image;
    this.resizable = true;

    if (!this.displayObject.texture.valid) {
      this.displayObject.texture.baseTexture.once("loaded", () => {
        this.width = this.displayObject.texture.width;
        this.height = this.displayObject.texture.height;
        // this.createRenderTexture();
        this.updatePivot();
      });
    }
  }
}