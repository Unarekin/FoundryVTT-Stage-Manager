import { coerceActor } from "../coercion";
import { InvalidActorError, InvalidStageObjectError, SpeakerNotFoundError } from "../errors";
import { logError } from "../logging";
import { StageManager } from "../StageManager";
import { PositionCoordinate, SerializedDialogueStageObject } from "../types";
import { ActorStageObject } from "./ActorStageObject";
import { ImageStageObject } from "./ImageStageObject";
import { PanelStageObject } from './PanelStageObject';
import { StageObject } from "./StageObject";
import { TextStageObject } from "./TextStageObject";
import { Conversation } from '../conversation';

export class DialogueStageObject extends StageObject<PIXI.Container> {
  public readonly type = "dialogue";
  public static type = "dialogue";

  #maxSpeakerWidth = 400;
  #maxSpeakerHeight = 400;
  #speakerSlotTop: PositionCoordinate = "-height + panelHeight";
  #speakerSlotWidth = 250;

  public get maxSpeakerWidth() { return this.#maxSpeakerWidth; }
  public set maxSpeakerWidth(width) {
    if (width !== this.maxSpeakerWidth) {
      this.#maxSpeakerWidth = width;
      // TODO Reposition/size speakers

      this.dirty = true;
    }
  }

  public get maxSpeakerHeight() { return this.#maxSpeakerHeight; }
  public set maxSpeakerHeight(height) {
    if (height !== this.maxSpeakerHeight) {
      this.#maxSpeakerHeight = height;
      // TODO Reposition/size speakers

      this.dirty = true;
    }
  }

  public get speakerSlotTop() { return this.#speakerSlotTop; }
  public set speakerSlotTop(top) {
    if (top !== this.speakerSlotTop) {
      this.#speakerSlotTop = top;
      // TODO Reposition/size speakers
      this.dirty = true;
    }
  }

  public get speakerSlotWidth() { return this.#speakerSlotWidth; }
  public set speakerSlotWidth(width) {
    if (width !== this.speakerSlotWidth) {
      this.#speakerSlotWidth = width;
      // TODO Reposition/size speakers

      this.dirty = true;
    }
  }


  private _textObject: TextStageObject = new TextStageObject("");
  private _labelObject: TextStageObject = new TextStageObject("");

  private _speakers: ImageStageObject[] = [];
  public get speakers() { return this._speakers; }

  private _panel: PanelStageObject;
  public get panel() { return this._panel; }

  public get text() { return this._textObject.text; }
  public set text(val) {
    if (this.text !== val) {
      this._textObject.text = val;
      this.dirty = true;
    }
  }

  public get textStyle() { return this._textObject.style; }
  public set textStyle(val) {
    this._textObject.style = val;
    this.dirty = true;
  }

  public get label() { return this._labelObject.text; }
  public set label(val) {
    if (val !== this.label) {
      this._labelObject.text = val;
      this.positionLabel();
      this.dirty = true;
    }
  }

  public get labelStyle() { return this._labelObject.style; }
  public set labelStyle(val) {
    this._labelObject.style = val;
    this.dirty = true;
  }

  public get dirty() {
    return (this._textObject.dirty || this._speakers.some(speaker => speaker.dirty || super.dirty));
  }
  public set dirty(val) {
    super.dirty = val;
    if (!val) {
      if (this._textObject) this._textObject.dirty = val;
      if (this._panel) this._panel.dirty = val;
      if (Array.isArray(this._speakers)) {
        for (const speaker of this._speakers)
          speaker.dirty = val;
      }
    }
  }




  public static deserialize(serialized: SerializedDialogueStageObject): DialogueStageObject {
    const obj = new DialogueStageObject(serialized.name);
    obj.deserialize(serialized);
    return obj;
  }

  public deserialize(serialized: SerializedDialogueStageObject) {
    try {
      super.deserialize(serialized);

      this.maxSpeakerHeight = serialized.maxSpeakerHeight;
      this.maxSpeakerWidth = serialized.maxSpeakerWidth;
      this.speakerSlotTop = serialized.speakerSlotTop;
      this.speakerSlotWidth = serialized.speakerSlotWidth;

      if (serialized.text) this._textObject.deserialize(serialized.text);
      if (serialized.panel) this._panel.deserialize(serialized.panel);


      if (!Array.isArray(serialized.speakers) || serialized.speakers.length === 0) {
        // Remove all speakers
        this.removeSpeakers([...this.speakers]);
      } else {
        // Determine speakers to be removed
        const toRemove = this.speakers.filter(speaker => !serialized.speakers.find(item => item.id === speaker.id));
        if (toRemove.length) this.removeSpeakers(toRemove);
        for (const speaker of serialized.speakers) {
          const extant = this.speakers.find(item => item.id === speaker.id);
          if (extant instanceof ImageStageObject) {
            // Already exists, update in-place
            extant.deserialize(speaker);
          } else {
            // Create new
            const deserialized = StageManager.deserialize(speaker);
            if (deserialized instanceof ImageStageObject) this.addSpeaker(deserialized);
            deserialized?.deserialize(speaker);
          }
        }
        // Match up order
        const speakers = [...this.speakers];
        this.speakers.splice(0, this.speakers.length);
        for (const speaker of serialized.speakers) {
          const index = speakers.findIndex(item => item.id === speaker.id);
          if (index !== -1) this.speakers.push(speakers[index]);
        }
      }

      this.displayObject.addChild(this._panel.displayObject);
      this.displayObject.addChild(this._textObject.displayObject)
    } catch (err) {
      logError(err as Error);
    }
  }

  public serialize(): SerializedDialogueStageObject {
    return {
      ...super.serialize(),
      type: DialogueStageObject.type,
      text: this._textObject.serialize(),
      panel: this._panel.serialize(),
      speakers: this.speakers.map(speaker => speaker.serialize()),
      label: this._labelObject.serialize(),
      speakerSlotWidth: this.speakerSlotWidth,
      speakerSlotTop: this.speakerSlotTop,
      maxSpeakerHeight: this.maxSpeakerHeight,
      maxSpeakerWidth: this.maxSpeakerWidth
    }
  }

  public createDragGhost(): PIXI.Container {
    const ghost = new PIXI.Container();


    for (const speaker of this.speakers) {
      const speakerGhost = speaker.createDragGhost();
      speakerGhost.name = speaker.name;
      ghost.addChild(speakerGhost);
    }

    const panelGhost = this.panel.createDragGhost();
    panelGhost.name = "panel";

    ghost.addChild(panelGhost);

    const textGhost = this._textObject.createDragGhost();
    textGhost.name = "text";
    ghost.addChild(textGhost);

    const labelGhost = this._labelObject.createDragGhost();
    labelGhost.name = "label";
    ghost.addChild(labelGhost);

    return ghost;
  }

  public get width() { return this.displayObject.width; }
  public set width(val) { /* empty */ }

  public get height() { return this.displayObject.height; }
  public set height(val) { /* empty */ }

  public destroy() {
    if (!this.destroyed) {
      super.destroy();
      this._textObject.destroy();
      this._panel.destroy();
      for (const speaker of this.speakers)
        speaker.destroy();
    }
  }

  #activeSpeaker: ImageStageObject | undefined = undefined;
  public get activeSpeaker() { return this.#activeSpeaker; }

  public deactivateSpeaker(): this {
    this.#activeSpeaker = undefined;
    for (const speaker of this.speakers)
      speaker.displayObject.tint = new PIXI.Color("white").toNumber();
    this.label = "";

    return this;
  }

  public activateSpeaker(obj: ImageStageObject): this
  public activateSpeaker(id: string): this
  public activateSpeaker(name: string): this
  public activateSpeaker(actor: Actor): this
  public activateSpeaker(arg: unknown): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const speaker = this.getSpeaker(arg as any);
    if (!speaker) throw new SpeakerNotFoundError(arg);
    this.#activeSpeaker = speaker;
    for (const speaker of this.speakers) {
      if (speaker !== this.activeSpeaker) speaker.displayObject.tint = new PIXI.Color("gray").toNumber();
      else speaker.displayObject.tint = new PIXI.Color("white").toNumber();
    }
    this.label = speaker.name;
    return this;
  }

  public addSpeaker(obj: ImageStageObject): this {
    if (!this.speakers.includes(obj)) {
      this.speakers.push(obj);
      this.displayObject.addChild(obj.displayObject);
      this.positionSpeaker(obj, false);
    }
    return this;
  }

  public slotPosition(slot: number): { x: PositionCoordinate, y: PositionCoordinate, z: PositionCoordinate } {
    return {
      x: 250 * slot,
      y: -this.maxSpeakerHeight + this.panel.height,
      z: (-10 * slot) - 10
    }
  }

  public speakerSlot(speaker: ImageStageObject): number {
    if (!this.speakers.includes(speaker)) throw new SpeakerNotFoundError(speaker);
    return this.speakers.indexOf(speaker);
  }

  public speakerSlotPosition(speaker: ImageStageObject) {
    if (!this.speakers.includes(speaker)) throw new SpeakerNotFoundError(speaker);
    return this.slotPosition(this.speakerSlot(speaker));
  }

  public positionSpeaker(speaker: ImageStageObject): this
  public positionSpeaker(speaker: ImageStageObject, animate: true): Promise<this>
  public positionSpeaker(speaker: ImageStageObject, animate: false): this
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public positionSpeaker(speaker: ImageStageObject, animate = false): this | Promise<this> {

    return this;
  }

  public removeSpeaker(obj: ImageStageObject): this
  public removeSpeaker(id: string): this
  public removeSpeaker(name: string): this
  public removeSpeaker(speaker: unknown) {
    const obj = speaker instanceof ImageStageObject ? speaker : this.speakers.find(item => item.id === speaker || item.name === speaker);
    if (!obj) throw new InvalidStageObjectError(speaker);
    const index = this.speakers.indexOf(obj);
    if (index !== -1) {
      this.speakers.splice(index, 1);
      obj.destroy();
    }
    return this;
  }

  public addActor(name: string): this
  public addActor(id: string): this
  public addActor(uuid: string): this
  public addActor(actor: ActorStageObject): this
  public addActor(actor: unknown): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const actual = coerceActor(actor as any);
    if (!(actual instanceof Actor)) throw new InvalidActorError(actor);
    const obj = new ActorStageObject(actual);
    this.addSpeaker(obj);
    return this;
  }

  public addSpeakers(speakers: ImageStageObject[]): this {
    for (const obj of speakers)
      this.addSpeaker(obj);
    return this;
  }

  public removeSpeakers(speakers: (ImageStageObject | string)[]): this {
    for (const speaker of speakers)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.removeSpeaker(speaker as any);
    return this;
  }



  /**
   * Retrieves a speaker present in this dialogue
   * @param {string} id - ID of the speaker to retrieve
   * 
   * @remarks id can refer to the id of an {@link ImageStageObject}, an {@link ActorStageObject}, or an {@link Actor}
   */
  public getSpeaker(id: string): ImageStageObject | undefined
  /**
   * Retrieves a speaker present in this dialogue
   * @param {string} name - Name of the speaker to retrieve
   * 
   * @remarks name can refer to the name of an {@link ImageStageObject}, an {@link ActorStageObject}, or an {@link Actor}
   */
  public getSpeaker(name: string): ImageStageObject | undefined
  /**
   * Retrieves a speaker present in this dialogue
   * @param {string} uuid - UUID of an {@link Actor} to find in this object's speakers
   */
  public getSpeaker(uuid: string): ActorStageObject | undefined
  /**
   * Retrieves a speaker present in this dialogue
   * @param {Actor} actor - {@link Actor} associated with a speaker
   */
  public getSpeaker(actor: Actor): ActorStageObject | undefined
  /**
   * Retrieves a speaker present in this dialogue
   * @param {ActorStageObject} actor - {@link ActorStageObject}
   */
  public getSpeaker(actor: ActorStageObject): ActorStageObject | undefined
  /**
   * Retrieves a speaker present in this dialogue
   * @param {ImageStageObject} image - {@link ImageStageObject} representing a speaker
   */
  public getSpeaker(image: ImageStageObject): ImageStageObject | undefined
  public getSpeaker(arg: unknown): ImageStageObject | ActorStageObject | undefined {
    if (arg instanceof ActorStageObject && this.speakers.includes(arg)) {
      return arg;
    } else if (arg instanceof ImageStageObject && this.speakers.includes(arg)) {
      return arg;
    } else if (typeof arg === "string") {
      return this.speakers.find(speaker => speaker.name === arg || speaker.id === arg);
    }
  }

  public positionLabel() {
    this._labelObject.x = this.panel.borders.left + 5;
    this._labelObject.y = -this._labelObject.height / 2;
  }


  public conversation() { return new Conversation(this); }

  constructor(text = "", name?: string) {
    const container = new PIXI.Container();
    super(container, name);
    this._panel = new PanelStageObject(`modules/${__MODULE_ID__}/assets/dialogues/default.webp`, 0, 0, 25, 25);
    this.text = text;

    this.displayObject.addChild(this._panel.displayObject);
    this.displayObject.addChild(this._textObject.displayObject);
    this.displayObject.addChild(this._labelObject.displayObject);

    this.displayObject.sortableChildren = true;
    this._textObject.anchor.x = 0;
    this._textObject.anchor.y = 0;
    this._textObject.y = this.panel.borders.top + 5;
    this._textObject.x = this.panel.borders.left + 5;
    const uiLeft = document.getElementById("ui-left");
    if (uiLeft instanceof HTMLElement) this._textObject.x = uiLeft.clientWidth / 2;


    this._labelObject.anchor.x = this._labelObject.anchor.y = 0;
    this._labelObject.x = this.panel.borders.left + 5;
    this._labelObject.y = -this._labelObject.height;
    this.labelStyle.fill = "white";
    this.labelStyle.dropShadow = true;
    this.labelStyle.dropShadowDistance = 2;
    this.labelStyle.dropShadowAlpha = .8;

    this.textStyle.fill = "white";
    this.textStyle.dropShadow = true;
    this.textStyle.dropShadowDistance = 2;
    this.textStyle.dropShadowAlpha = .8;

    this.panel.width = window.innerWidth;
    this.scope = "temp";

    // Set word wrap
    this._textObject.style.wordWrap = true;
    const uiRight = document.getElementById("ui-right");
    this._textObject.style.wordWrapWidth = this.panel.width - this._textObject.x;
    if (uiRight instanceof HTMLElement) this._textObject.style.wordWrapWidth -= uiRight.clientWidth;

    if (this.panel.displayObject.texture.valid) {
      this.y = StageManager.VisualBounds.bottom - this.panel.height;
    } else {
      this.panel.displayObject.texture.baseTexture.once("loaded", () => {
        this.y = StageManager.VisualBounds.bottom - this.panel.height;
      });
    }
    this.panel.alpha = 0.8;


    this.clickThrough = true;
  }

}