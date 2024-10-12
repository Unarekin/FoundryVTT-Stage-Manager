import { StageObject } from "./StageObject";

// export type TextStyle = PIXI.TextStyle | PIXI.HTMLTextStyle;

export class TextStageObject extends StageObject {
  public displayObject: PIXI.HTMLText;

  #text$ = new rxjs.BehaviorSubject<string>("");

  public get text() { return this.#text$.value; }
  public set text(value: string) { this.#text$.next(value); }
  public readonly text$ = this.#text$.asObservable().pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged()
  );

  public style: PIXI.ITextStyle = PIXI.TextStyle.defaultStyle;

  constructor(text: string, style?: PIXI.ITextStyle) {
    super();
    this.#text$.next(text);
    if (style) this.style = style;
    this.displayObject = new PIXI.HTMLText(text, style);
  }

}