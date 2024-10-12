import { Position, Size } from '../interfaces';

/**
 * Generic object that can be displayed and manipulated on the stage
 */
export abstract class StageObject {
  public readonly id: string = foundry.utils.randomID();

  #destroy$ = new rxjs.Subject<void>();

  #visible$ = new rxjs.BehaviorSubject<boolean>(false);
  #position$ = new rxjs.BehaviorSubject<Position>({ x: 0, y: 0 });
  #size$ = new rxjs.BehaviorSubject<Size>({ width: 0, height: 0 });
  #zIndex$ = new rxjs.BehaviorSubject<number>(0);

  public get visible(): boolean { return this.#visible$.value; }
  public set visible(value: boolean) { this.#visible$.next(value); }
  public readonly visible$ = this.#visible$.asObservable();

  public get position(): Position { return this.#position$.value; }
  public set position(value: Position) { this.#position$.next(value); }
  public readonly position$ = this.#position$.asObservable();

  public get x(): number { return this.#position$.value.x; }
  public set x(value: number) { this.#position$.next({ x: value, y: this.#position$.value.y }) }
  public readonly x$ = this.position$.pipe(
    rxjs.takeUntil(this.#destroy$),
    rxjs.map(pos => pos.x),
    rxjs.distinctUntilChanged()
  );

  public get y(): number { return this.#position$.value.y; }
  public set y(value: number) { this.#position$.next({ x: this.#position$.value.x, y: value }); }
  public readonly y$ = this.position$.pipe(
    rxjs.takeUntil(this.#destroy$),
    rxjs.map(pos => pos.y),
    rxjs.distinctUntilChanged()
  );

  public get size(): Size { return this.#size$.value; }
  public set size(value: Size) { this.#size$.next(value); }
  public readonly size$ = this.#size$.asObservable();

  public get width(): number { return this.#size$.value.width; }
  public set width(value: number) { this.#size$.next({ width: value, height: this.#size$.value.height }); }
  public readonly width$ = this.#size$.pipe(
    rxjs.takeUntil(this.#destroy$),
    rxjs.map(size => size.width),
    rxjs.distinctUntilChanged()
  );

  public get height(): number { return this.#size$.value.height; }
  public set height(value: number) { this.#size$.next({ width: this.#size$.value.width, height: value }); }
  public readonly height$ = this.#size$.pipe(
    rxjs.takeUntil(this.#destroy$),
    rxjs.map(size => size.height),
    rxjs.distinctUntilChanged()
  );

  public get zIndex(): number { return this.#zIndex$.value; }
  public set zIndex(value: number) { this.#zIndex$.next(value); }
  public readonly zIndex$ = this.#zIndex$.asObservable();

  public abstract displayObject: PIXI.DisplayObject;

  public destroy() {
    // Notify internal subscriptions
    this.#destroy$.next();
  }

}
