import { StageObject } from "./StageObject";

type TextStyle = PIXI.TextStyle | PIXI.HTMLTextStyle;

export class TextStageObject extends StageObject {
  public displayObject: PIXI.HTMLText;

  #text$ = new rxjs.Subject<string>();
  #style$ = new rxjs.Subject<TextStyle>();

  public get text() { return this.#text$.value; }
  public set text(value: string) { this.#text$.next(value); }
  public readonly text$ = this.#text$.asObservable();

  public get style() { return this.#style$.value; }
  public set style(value: TextStyle) { this.#style$.next(value); }
  public readonly styel$ = this.#style$.asObservable();

  constructor(text: string, style?: TextStyle) {
    super();
    this.#text$.next(text);
    this.#style$.next(style);
    this.displayObject = new PIXI.HTMLText(text, style);
  }

}