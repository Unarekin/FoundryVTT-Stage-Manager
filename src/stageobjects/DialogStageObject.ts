import { NoPortraitError } from "../errors";
import { log } from "../logging";
import { SerializedDialogStageObject } from "../types";
import { CompoundStageObject } from "./CompoundStageObject";
import { ImageStageObject } from "./ImageStageObject";
import { PanelStageObject } from "./PanelStageObject";
import { TextStageObject } from "./TextStageObject";

export class DialogStageObject extends CompoundStageObject {
  public static type = "dialog";
  public readonly type = "dialog";

  private _panelObj: PanelStageObject;
  private _textObj: TextStageObject;
  private _portraitObj: ImageStageObject | null = null;

  public get panelObject() { return this._panelObj; }
  public get textObject() { return this._textObj; }
  public get portraitObject() { return this._portraitObj; }

  public createDragGhost(): PIXI.Container {
    const container = new PIXI.Container();
    const panelGhost = this._panelObj.createDragGhost();
    const textGhost = this._textObj.createDragGhost();
    container.addChild(panelGhost);
    container.addChild(textGhost);
    if (this._portraitObj) {
      const portraitGhost = this._portraitObj.createDragGhost();
      container.addChild(portraitGhost);
    }
    return container;
  }

  public get width() { return this.panelObject.width; }
  public set width(val) {
    // this.displayObject.width = val;
    super.width = val;
    this.panelObject.width = val;
    this.positionTextObject();
    // this.updateScaledDimensions();
  }

  public get height() { return this.panelObject.height; }
  public set height(val) {
    super.height = val;
    this.panelObject.height = val;
    this.positionTextObject();
    // this.updateScaledDimensions();
  }

  public destroy() {
    if (!this.destroyed) {
      super.destroy();
      this._panelObj.destroy();
      this._textObj.destroy()
      if (this._portraitObj instanceof ImageStageObject) this._portraitObj.destroy();
    }
  }

  private _showPortrait = false;
  public get showPortrait() { return (this._portraitObj instanceof ImageStageObject && this._showPortrait) }
  public set showPortrait(val) {
    if (this._portraitObj instanceof ImageStageObject) {
      if (val !== this.showPortrait) {
        this.dirty = true;
        this._showPortrait = val;
      }
    } else {
      throw new NoPortraitError();
    }
  }

  protected positionTextObject() {
    this.textObject.x = this.panelObject.borders.left;
    this.textObject.y = this.panelObject.borders.top;
    this.textObject.style.wordWrapWidth = this.panelObject.width - this.panelObject.borders.left - this.panelObject.borders.right

    if (this.showPortrait && this.portraitObject instanceof ImageStageObject) {
      this.textObject.x += this.portraitObject.width;
      this.textObject.style.wordWrapWidth -= this.portraitObject.width;
    }
  }

  public deserialize(serialized: SerializedDialogStageObject) {
    super.deserialize(serialized);

    if (!(this._textObj instanceof TextStageObject)) this._textObj = TextStageObject.deserialize(serialized.text);
    else this._textObj.deserialize(serialized.text);

    if (!(this._panelObj instanceof PanelStageObject)) this._panelObj = PanelStageObject.deserialize(serialized.panel);
    else this._panelObj.deserialize(serialized.panel);

    log("Setting size:", this.actualBounds.width * serialized.bounds.width, this.actualBounds.height * serialized.bounds.height)
    this._panelObj.width = this.actualBounds.width * serialized.bounds.width;
    this._panelObj.height = this.actualBounds.height * serialized.bounds.height;
    log(this.width, this.height);
    log(this._panelObj.displayObject.texture.valid);

    if (serialized.portrait?.src) {
      if (!(this._portraitObj instanceof ImageStageObject)) this._portraitObj = ImageStageObject.deserialize(serialized.portrait);
      else this._portraitObj.deserialize(serialized.portrait);
    } else if (this._portraitObj instanceof ImageStageObject) {
      this._portraitObj.destroy();
      this._portraitObj = null;
    }


    // this.width = this.actualBounds.width * serialized.bounds.width;
    // this.height = this.actualBounds.height * serialized.bounds.height;
    // this.scale.x = 1;
    // this.scale.y = 1;
    // this.width = this.panelObject.width;
    // this.height = this.panelObject.height;
  }

  public static deserialize(serialized: SerializedDialogStageObject): DialogStageObject {
    const { left, right, top, bottom } = serialized.panel.borders;
    const obj = new DialogStageObject(serialized.text.text, serialized.panel.src, left, right, top, bottom, serialized.text.style as unknown as PIXI.HTMLTextStyle, serialized.name);
    obj.deserialize(serialized);
    return obj;
  }

  public serialize(): SerializedDialogStageObject {
    const panel = this.panelObject.serialize();
    return {
      ...super.serialize(),
      type: DialogStageObject.type,
      text: this.textObject.serialize(),
      ...(this.portraitObject ? { portrait: this.portraitObject.serialize() } : {}),
      panel
    }
  }

  public set dirty(val) {
    super.dirty = val;
    if (this._panelObj instanceof PanelStageObject) this._panelObj.dirty = val;
    if (this._textObj instanceof TextStageObject) this._textObj.dirty = val;
    if (this._portraitObj instanceof ImageStageObject) this._portraitObj.dirty = val;
  }
  public get dirty() {
    const dirty = super.dirty || (this.portraitObject?.dirty ?? false) || this.panelObject.dirty || this.textObject.dirty;
    return dirty;
  }

  public get portrait() { return this.portraitObject?.path }
  public set portrait(val) {
    if (!val && this.portraitObject instanceof ImageStageObject) {
      this.portraitObject.destroy();
      this._portraitObj = null;
      this.dirty = true;
    } else if (val && !(this.portraitObject instanceof ImageStageObject)) {
      this._portraitObj = new ImageStageObject(val, this.name);
      this.dirty = true;
    } else if (val && this.portraitObject instanceof ImageStageObject) {
      this.portraitObject.path = val;
      this.dirty = true;
    }

  }

  constructor(text: string, background: string, left: number, right: number, top: number, bottom: number, style: PIXI.HTMLTextStyle = PIXI.HTMLTextStyle.defaultStyle as PIXI.HTMLTextStyle, name?: string) {
    super(name);

    this._panelObj = new PanelStageObject(background, left, right, top, bottom);
    this._textObj = new TextStageObject(text, style);
    this._textObj.anchor.x = 0;
    this._textObj.anchor.y = 0;

    this.displayObject.addChild(this.panelObject.displayObject);
    this.displayObject.addChild(this.textObject.displayObject);

    this.resizable = true;
    this.positionTextObject();

  }

}