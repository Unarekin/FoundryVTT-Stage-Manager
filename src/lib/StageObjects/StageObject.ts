import { Position, Size } from '../interfaces';

/**
 * Generic object that can be displayed and manipulated on the stage
 */
export abstract class StageObject {
  public readonly id: string = foundry.utils.randomID();

  public readonly destroy$ = new rxjs.Subject<void>();
  #destroyed = false;
  public get destroyed() { return this.#destroyed; }


  #visible$ = new rxjs.BehaviorSubject<boolean>(false);
  #position$ = new rxjs.BehaviorSubject<Position>({ x: 0, y: 0 });
  #size$ = new rxjs.BehaviorSubject<Size>({ width: 0, height: 0 });
  #zIndex$ = new rxjs.BehaviorSubject<number>(0);

  public get visible(): boolean { return this.#visible$.value; }
  public set visible(value: boolean) { this.#visible$.next(value); }
  public readonly visible$ = this.#visible$.asObservable().pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged()
  );
  // eslint-disable-next-line no-unused-private-class-members
  #visibleChanged = this.visible$.pipe(
    rxjs.takeUntil(this.destroy$)
  ).subscribe(visible => {
    if (this.displayObject) this.displayObject.visible = visible;
  });

  public get position(): Position { return this.#position$.value; }
  public set position(value: Position) { this.#position$.next(value); }
  public readonly position$ = this.#position$.asObservable().pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged((prev, curr) => prev.x !== curr.x || prev.y !== curr.y)
  );

  public get x(): number { return this.#position$.value.x; }
  public set x(value: number) { this.#position$.next({ x: value, y: this.#position$.value.y }) }
  public readonly x$ = this.position$.pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.map(pos => pos.x),
    rxjs.distinctUntilChanged()
  );

  public get y(): number { return this.#position$.value.y; }
  public set y(value: number) { this.#position$.next({ x: this.#position$.value.x, y: value }); }
  public readonly y$ = this.position$.pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.map(pos => pos.y),
    rxjs.distinctUntilChanged()
  );

  public get size(): Size { return this.#size$.value; }
  public set size(value: Size) { this.#size$.next(value); }
  public readonly size$ = this.#size$.asObservable().pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged((prev, curr) => prev.width !== curr.width || prev.height !== curr.height)
  );

  public get width(): number { return this.#size$.value.width; }
  public set width(value: number) { this.#size$.next({ width: value, height: this.#size$.value.height }); }
  public readonly width$ = this.#size$.pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.map(size => size.width),
    rxjs.distinctUntilChanged()
  );

  public get height(): number { return this.#size$.value.height; }
  public set height(value: number) { this.#size$.next({ width: this.#size$.value.width, height: value }); }
  public readonly height$ = this.#size$.pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.map(size => size.height),
    rxjs.distinctUntilChanged()
  );

  public get zIndex(): number { return this.#zIndex$.value; }
  public set zIndex(value: number) { this.#zIndex$.next(value); }
  public readonly zIndex$ = this.#zIndex$.asObservable().pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged()
  )
  // eslint-disable-next-line no-unused-private-class-members
  #zIndexChanged = this.zIndex$.pipe(
    rxjs.takeUntil(this.destroy$)
  ).subscribe(zIndex => { if (this.displayObject) this.displayObject.zIndex = zIndex; });

  public abstract displayObject: PIXI.DisplayObject;

  // eslint-disable-next-line no-unused-private-class-members
  #changePosition$ = this.position$.pipe(
    rxjs.takeUntil(this.destroy$),
  ).subscribe(position => {

    if (this.displayObject) {
      this.displayObject.x = position.x;
      this.displayObject.y = position.y;
    }
  });

  public destroy() {
    // Notify internal subscriptions
    this.#destroyed = true;
    this.destroy$.next();
    this.displayObject.destroy();
  }

}
