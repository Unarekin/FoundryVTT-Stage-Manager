import { StageObject } from "./StageObject";

export class ImageStageObject extends StageObject {

  protected override _displayObject: PIXI.Sprite;
  public override get displayObject() { return this._displayObject; }

  //#region Sizing
  #width = new rxjs.BehaviorSubject<number>(0);
  public get width(): number { return this.displayObject.width; }
  public set width(value: number) {
    this.displayObject.width = value;
    this.#width.next(value);
  }
  public readonly width$ = this.#width.asObservable();

  #height = new rxjs.BehaviorSubject<number>(0);
  public get height(): number { return this.displayObject.height; }
  public set height(value: number) {
    this.displayObject.height = value;
    this.#height.next(value);
  }
  public readonly height$ = this.#height.asObservable();
  //#endregion

  //#region Drawing
  #blendMode = new rxjs.BehaviorSubject<PIXI.BLEND_MODES>(PIXI.BLEND_MODES.NORMAL);
  public get blendMode(): PIXI.BLEND_MODES { return this.displayObject.blendMode; }
  public set blendMode(value: PIXI.BLEND_MODES) {
    this.displayObject.blendMode = value;
    this.#blendMode.next(value);
  }
  public readonly blendMode$ = this.#blendMode.asObservable();

  #tint = new rxjs.BehaviorSubject<PIXI.ColorSource>(0xFFFFFF);
  public get tint(): PIXI.ColorSource { return this.displayObject.tint; }
  public set tint(value: PIXI.ColorSource) {
    this.displayObject.tint = value;
    this.#tint.next(value);
  }
  public readonly tint$ = this.#tint.asObservable();

  #roundPixels = new rxjs.BehaviorSubject<boolean>(false);
  public get roundPixels(): boolean { return this.displayObject.roundPixels; }
  public set roundPixels(value: boolean) {
    this.displayObject.roundPixels = value;
    this.#roundPixels.next(value);
  }
  public readonly roundPixels$ = this.#roundPixels.asObservable();

  //#endregion

  #anchor = new rxjs.BehaviorSubject<Point>({ x: 0, y: 0 });
  public get anchor(): Point { return this.displayObject.anchor; }
  public set anchor(value: Point) {
    this.displayObject.anchor.x = value.x;
    this.displayObject.anchor.y = value.y;
    this.#anchor.next(value);
  }
  public readonly anchor$ = this.#anchor.asObservable();


  constructor(source: PIXI.SpriteSource) {
    const sprite = PIXI.Sprite.from(source);
    super(sprite);
    this._displayObject = sprite;
  }
}