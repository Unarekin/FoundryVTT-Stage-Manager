import { NoPortraitError } from "../errors";
import { SerializedDialogStageObject, StageLayer } from "../types";
import { CompoundStageObject } from "./CompoundStageObject";
import { ImageStageObject } from "./ImageStageObject";
import { PanelStageObject } from "./PanelStageObject";
import { TextStageObject } from "./TextStageObject";

export class DialogStageObject extends CompoundStageObject {
  public static type = "dialog";
  public readonly type = "dialog";

  private _panelObj: PanelStageObject;
  private _textObj: TextStageObject;
  private _portraitObj: ImageStageObject;

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
    }
  }

  private _showPortrait = false;
  public get showPortrait() { return (this._portraitObj instanceof ImageStageObject && this._showPortrait) }
  public set showPortrait(val) {
    if (this._portraitObj instanceof ImageStageObject) {
      if (val !== this.showPortrait) {
        this.dirty = true;
        this._showPortrait = val;
        this.portraitObject.displayObject.visible = val;
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
    this.textObject.scale.x = this.textObject.scale.y = 1;
  }

  public deserialize(serialized: SerializedDialogStageObject) {
    super.deserialize(serialized);

    if (!(this._textObj instanceof TextStageObject)) this._textObj = TextStageObject.deserialize(serialized.text);
    else this._textObj.deserialize(serialized.text);

    if (!(this._panelObj instanceof PanelStageObject)) this._panelObj = PanelStageObject.deserialize(serialized.panel);
    else this._panelObj.deserialize(serialized.panel);

    if (!serialized.portrait.src) serialized.portrait.src = `modules/${__MODULE_ID__}/assets/transparent.webp`;

    if (!(this._portraitObj instanceof ImageStageObject)) this._portraitObj = ImageStageObject.deserialize(serialized.portrait);
    else this._portraitObj.deserialize(serialized.portrait);

    this.displayObject.addChild(this._panelObj.displayObject);
    this.displayObject.addChild(this._textObj.displayObject);
    this.displayObject.addChild(this._portraitObj.displayObject);

    this.panelObject.displayObject.name = `${this.id}-panel`;
    this.portraitObject.displayObject.name = `${this.id}-portrait`;
    this.textObject.displayObject.name = `${this.id}-text`;

    this.panelObject.x = 0;
    this.panelObject.y = 0;

    this.showPortrait = serialized.showPortrait;
    this.portraitObject.x = this.panelObject.borders.left;
    this.portraitObject.y = this.panelObject.borders.top;

    this.showPortrait = serialized.showPortrait;

    if (!this.portraitObject.texture.valid)
      this.portraitObject.texture.baseTexture.once("loaded", () => { this.positionTextObject(); });
    else
      this.positionTextObject();
  }

  public static deserialize(serialized: SerializedDialogStageObject): DialogStageObject {
    const { left, right, top, bottom } = serialized.panel.borders;
    const obj = new DialogStageObject(serialized.text.text, serialized.panel.src, left, right, top, bottom, serialized.text.style as unknown as PIXI.HTMLTextStyle, serialized.name);
    obj.deserialize(serialized);
    return obj;
  }

  public serialize(): SerializedDialogStageObject {

    const defaultPortrait = {
      id: foundry.utils.randomID(),
      name: "",
      src: `modules/${__MODULE_ID__}/assets/transparent.webp`,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      loop: false,
      type: "image",
      owners: [],
      version: __MODULE_VERSION__,
      layer: this.layer as StageLayer,
      scope: this.scope,
      scopeOwners: [...this.scopeOwners],
      triggersEnabled: true,
      locked: false,
      triggers: {},
      skew: { x: 0, y: 0 },
      angle: 0,
      restrictToVisualArea: false,
      filters: [],
      alpha: 1,
      zIndex: 0,
      clickThrough: false,
      effects: [],
      effectsEnabled: true
    }

    const serialized = {
      ...super.serialize(),
      type: DialogStageObject.type,
      text: this.textObject.serialize(),
      portrait: this.portraitObject instanceof ImageStageObject ? this.portraitObject.serialize() : defaultPortrait,
      panel: this.panelObject.serialize(),
      showPortrait: this.showPortrait
    }

    return serialized;
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
      // this.portraitObject.destroy();
      this.portraitObject.path = `modules/${__MODULE_ID__}/assets/transparent.webp`;
      this.dirty = true;
    } else if (val && !(this.portraitObject instanceof ImageStageObject)) {
      this._portraitObj = new ImageStageObject(val, this.name);
      this.addChild(this._portraitObj);
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

    this._portraitObj = new ImageStageObject(`modules/${__MODULE_ID__}/assets/transparent.webp`);

    this.displayObject.addChild(this.panelObject.displayObject);
    this.displayObject.addChild(this.textObject.displayObject);
    this.displayObject.addChild(this.portraitObject.displayObject);

    this.addChild(this.panelObject)
    this.addChild(this.textObject);
    this.addChild(this.portraitObject);

    this.resizable = true;
    this.positionTextObject();

  }

}