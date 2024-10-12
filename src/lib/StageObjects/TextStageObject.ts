import { Size } from "../interfaces";
import { StageObject } from "./StageObject";

export class TextStageObject extends StageObject {
  protected _displayObject: PIXI.HTMLText;
  public get displayObject() { return this._displayObject; }

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

  #maxWidth = new rxjs.BehaviorSubject<number>(0);
  public get maxWidth(): number { return this.displayObject.maxWidth; }
  public set maxWidth(value: number) {
    this.displayObject.maxWidth = value;
    this.#maxWidth.next(value);
  }
  public readonly maxWidth$ = this.#maxWidth.asObservable();

  #maxHeight = new rxjs.BehaviorSubject<number>(0);
  public get maxHeight(): number { return this.displayObject.maxHeight; }
  public set maxHeight(value: number) {
    this.displayObject.maxHeight = value;
    this.#maxHeight.next(value);
  }
  public readonly maxHeight$ = this.#maxHeight.asObservable();

  #resolution = new rxjs.BehaviorSubject<number>(1);
  public get resolution(): number { return this.displayObject.resolution; }
  public set resolution(value: number) {
    this.displayObject.resolution = value;
    this.#resolution.next(value);
  }
  public readonly resolution$ = this.#resolution.asObservable();
  //#endregion

  //#region Text
  #text = new rxjs.BehaviorSubject<string>("");
  public get text(): string { return this.displayObject.text; }
  public set text(value: string) {
    this.displayObject.text = value;
    this.#text.next(value);
  }
  public readonly text$ = this.#text.asObservable();

  #style = new rxjs.BehaviorSubject<PIXI.HTMLTextStyle>(PIXI.HTMLTextStyle.defaultStyle as PIXI.HTMLTextStyle);
  public get style(): PIXI.HTMLTextStyle { return this.displayObject.style; }
  public set style(value: PIXI.HTMLTextStyle) {
    this.displayObject.style = value;
    this.#style.next(value);
  }
  public readonly style$ = this.#style.asObservable();
  //#endregion

  //#region Styling
  #fill = new rxjs.BehaviorSubject<PIXI.TextStyleFill>(0xfff);
  public get fill(): PIXI.TextStyleFill { return this.displayObject.style.fill }
  public set fill(value: PIXI.TextStyleFill) {
    this.displayObject.style.fill = value;
    this.#fill.next(value);
  }
  public readonly fill$ = this.#fill.asObservable();

  public get color(): PIXI.TextStyleFill { return this.fill; }
  public set color(value: PIXI.TextStyleFill) { this.fill = value; }
  public readonly color$ = this.fill$;

  #stroke = new rxjs.BehaviorSubject<string | number>(0);
  public get stroke(): string | number { return this.displayObject.style.stroke; }
  public set stroke(value: string | number) {
    this.displayObject.style.stroke = value;
    this.#stroke.next(value);
  }
  public readonly stroke$ = this.#stroke.asObservable();

  public get outline(): string | number { return this.stroke; }
  public set outline(value: string | number) { this.stroke = value; }
  public readonly outline$ = this.stroke$;

  //#endregion

  //#region Methods
  public measureText() {
    return this.displayObject.measureText() as Size;
  }
  //#endregion

  //#region Construction
  constructor(text: string, style?: PIXI.HTMLTextStyle) {
    const textObj = new PIXI.HTMLText(text, style);
    super(textObj);
    this._displayObject = textObj;
  }
  //#endregion
}
