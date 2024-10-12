import { Size } from "../interfaces";
import { StageObject } from "./StageObject";

export class TextStageObject extends StageObject {
  #displayObject: PIXI.HTMLText;
  public get displayObject() { return this.#displayObject; }

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

  //#region Methods
  public measureText() {
    return this.displayObject.measureText() as Size;
  }
  //#endregion

  //#region Construction
  constructor(text: string, style?: PIXI.HTMLTextStyle) {
    const textObj = new PIXI.HTMLText(text, style);
    super(textObj);
    this.#displayObject = textObj;

  }
  //#endregion
}

// import { StageObject } from "./StageObject";

// // export type TextStyle = PIXI.TextStyle | PIXI.HTMLTextStyle;

// export class TextStageObject extends StageObject {
//   public displayObject: PIXI.HTMLText;

//   #text$ = new rxjs.BehaviorSubject<string>("");

//   public get text() { return this.#text$.value; }
//   public set text(value: string) { this.#text$.next(value); }
//   public readonly text$ = this.#text$.asObservable().pipe(
//     rxjs.takeUntil(this.destroy$),
//     rxjs.distinctUntilChanged()
//   );

//   public style: PIXI.HTMLTextStyle = PIXI.TextStyle.defaultStyle;

//   constructor(text: string, style?: PIXI.HTMLTextStyle) {
//     super();
//     this.#text$.next(text);
//     if (style) this.style = style;
//     this.displayObject = new PIXI.HTMLText(text, style);
//   }

// }