import { SerializedPanelStageObject } from "../types";
import { StageObject } from "./StageObject";
import { ObservableBorder } from "./ObservableBorder";

export class PanelStageObject extends StageObject<PIXI.NineSlicePlane> {
  public static readonly type: string = "panel";
  public readonly type: string = "panel";


  private _borders: ObservableBorder;
  public get borders() { return this._borders; }


  // public get borders() { return { left: this.displayObject.leftWidth, right: this.displayObject.rightWidth, top: this.displayObject.topHeight, bottom: this.displayObject.bottomHeight } }


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

    this.src = serialized.src;

    void this.textureLoaded().then(() => {
      this.width = Math.abs(this.width);
      this.height = Math.abs(this.height);

      if (serialized.bounds.width < 0) this.scale.x *= -1;
      if (serialized.bounds.height < 0) this.scale.y *= -1;

      this.borders.left = serialized.borders.left;
      this.borders.right = serialized.borders.right;
      this.borders.top = serialized.borders.top;
      this.borders.bottom = serialized.borders.bottom;
    });
  }

  public serialize(): SerializedPanelStageObject {
    const serialized = super.serialize();
    return {
      ...serialized,
      type: PanelStageObject.type,
      src: this.src,
      bounds: {
        ...serialized.bounds,
        width: (this.width * this.scale.x) / this.actualBounds.width,
        height: (this.height * this.scale.y) / this.actualBounds.height
      },
      borders: {
        left: this.borders.left,
        right: this.borders.right,
        top: this.borders.top,
        bottom: this.borders.bottom
      }
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
    // this.pivot.x = this.width / 2;
    // this.pivot.y = this.height / 2;
  }

  public get width() { return this.displayObject.width; }
  public set width(val) {
    if (val !== this.width) {
      if (!this.displayObject.texture.valid) {
        this.displayObject.texture.baseTexture.once("loaded", () => { this.width = val; });
      } else {
        this.dirty = true;
        this.displayObject.width = val;
        // this.updateScaledDimensions();
        this.updatePivot();
      }
    }
  }

  public get height() { return this.displayObject.height; }
  public set height(val) {
    if (val !== this.height) {
      if (!this.displayObject.texture.valid) {
        this.displayObject.texture.baseTexture.once("loaded", () => { this.height = val; });
      } else {
        this.dirty = true;
        this.displayObject.height = val;
        // this.updateScaledDimensions();
        this.updatePivot();
      }
    }
  }

  public textureLoaded(): Promise<void> {
    return new Promise(resolve => {
      if (this.displayObject.texture.valid) {
        resolve();
      } else {
        this.displayObject.texture.baseTexture.once("loaded", () => { resolve(); });
      }
    })
  }

  public get x() { return super.x; }
  public set x(val) {
    if (val !== this.x) {
      super.x = val;
      this.updatePivot();
    }
  }

  public get y() { return super.y; }
  public set y(val) {
    if (val !== this.y) {
      super.y = val;
      this.updatePivot();
    }
  }




  public get baseWidth() { return this.displayObject.texture.width; }
  public get baseHeight() { return this.displayObject.texture.height; }


  protected borderChanged(left: number, right: number, top: number, bottom: number) {
    this.displayObject.leftWidth = left;
    this.displayObject.rightWidth = right;
    this.displayObject.topHeight = top;
    this.displayObject.bottomHeight = bottom;
  }

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

    this._borders = new ObservableBorder(left, right, top, bottom, this.borderChanged.bind(this));

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