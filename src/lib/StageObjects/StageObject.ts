import createProxyPoint from '../ProxyPoint';
import { Point } from "../interfaces";
import createProxyArray from '../ProxyArray';

/**
 * Generic object that can be displayed and manipulated on the stage
 */
export abstract class StageObject {
  public readonly id: string = foundry.utils.randomID();

  public name: string = this.id;

  //#region Destruction
  public readonly destroy$ = new rxjs.Subject<void>();
  #destroyed = false;
  public get destroyed() { return this.#destroyed; }


  public destroy() {
    // Notify internal subscriptions
    this.onDestroy();
    this.#destroyed = true;
    this.destroy$.next();
    this.displayObject?.destroy();
  }
  //#endregion


  protected _displayObject: PIXI.DisplayObject;
  public get displayObject(): PIXI.DisplayObject { return this._displayObject; }

  //#region Positioning
  #x = new rxjs.BehaviorSubject<number>(0);
  public get x(): number { return this.displayObject.x; }
  public set x(value: number) {
    this.displayObject.x = value;
    this.#x.next(value);
    this.#position$.next({ x: value, y: this.y });
  }
  public readonly x$ = this.#x.asObservable();

  #y = new rxjs.BehaviorSubject<number>(0);
  public get y(): number { return this.displayObject.y; }
  public set y(value: number) {
    this.displayObject.y = value;
    this.#y.next(value);
    this.#position$.next({ x: this.x, y: value });
  }
  public readonly y$ = this.#y.asObservable();

  #position: Point;
  #position$ = new rxjs.BehaviorSubject<Point>({ x: 0, y: 0 });
  public get position(): Point { return this.#position; }
  public set position(value: Point) {
    this.#position = createProxyPoint(value, this.x$, this.y$);
    this.#position$.next(this.#position);
  }
  public readonly position$ = rxjs.combineLatest([
    this.x$,
    this.y$
  ]).pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged(([x1, y1], [x2, y2]) => x1 !== x2 || y1 !== y2)
  );

  #zIndex = new rxjs.BehaviorSubject<number>(0);
  public get zIndex(): number { return this.displayObject.zIndex; }
  public set zIndex(value: number) {
    this.displayObject.zIndex = value;
    this.#zIndex.next(value);
  }
  public readonly zIndex$ = this.#zIndex.asObservable();
  //#endregionthis.#zi

  //#region Rotation
  #rotation = new rxjs.BehaviorSubject<number>(0);
  /** The rotation of this StageObject in radians */
  public get rotation(): number { return this.displayObject.rotation; }
  /** The rotation of this StageObject in radians */
  public set rotation(value: number) {
    this.displayObject.rotation = value;
    this.#rotation.next(value);
  }
  /** The rotation of this StageObject in radians */
  public readonly rotation$ = this.#rotation.asObservable();

  /** The rotation of this StageObject in degrees */
  public get angle(): number { return Math.toDegrees(this.rotation); }
  /** The rotation of this StageObject in degrees */
  public set angle(value: number) { this.rotation = Math.toRadians(value); }
  /** The rotation of this StageObject in degrees */
  public readonly angle$ = this.rotation$.pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged(),
    rxjs.map(val => Math.toDegrees(val))
  );


  #pivot: Point;
  #pivot$ = new rxjs.BehaviorSubject<Point>({ x: 0, y: 0 });
  #pivotX$ = new rxjs.BehaviorSubject<number>(0);
  #pivotY$ = new rxjs.BehaviorSubject<number>(0);
  public get pivot(): Point { return this.#pivot; }
  public set pivot(value: Point) {
    this.#pivot = createProxyPoint(value, this.#pivotX$, this.#pivotY$);
    this.#pivot$.next(this.#pivot);
    this.#pivotX$.next(this.#pivot.x);
    this.#pivotY$.next(this.#pivot.y);
  }
  public readonly pivot$ = this.#pivot$.asObservable();

  //#endregion

  //#region Opacity
  #opacity = new rxjs.BehaviorSubject<number>(1);
  public get opacity(): number { return this.displayObject.alpha; }
  public set opacity(value: number) {
    this.displayObject.alpha = value;
    this.#opacity.next(value);
  }
  public readonly opacity$ = this.#opacity.asObservable();

  public get alpha(): number { return this.opacity; }
  public set alpha(value: number) { this.opacity = value; }
  public readonly alpha$ = this.opacity$;
  //#endregion

  //#region Visiblity
  #visible = new rxjs.BehaviorSubject<boolean>(true);
  public get visible(): boolean { return this.displayObject.renderable; }
  public set visible(value: boolean) {
    this.displayObject.renderable = value;
    this.#visible.next(value);
  }
  public readonly visible$ = this.#visible.asObservable();
  //#endregion

  //#region Skew
  #skew: Point;
  #skewX$ = new rxjs.BehaviorSubject<number>(0);
  #skewY$ = new rxjs.BehaviorSubject<number>(0);
  #skew$ = new rxjs.BehaviorSubject<Point>({ x: 0, y: 0 });

  public get skew(): Point { return this.#skew; }
  public set skew(value: Point) {
    this.#skew = createProxyPoint(value, this.#skewX$, this.#skewY$);
    this.#skew$.next(this.#skew);
  }
  public readonly skew$ = this.#skew$.asObservable();

  // eslint-disable-next-line no-unused-private-class-members
  #skewChange$ = rxjs.combineLatest([
    this.#skewX$,
    this.#skewY$
  ]).pipe(
    rxjs.takeUntil(this.destroy$),
    rxjs.distinctUntilChanged(([x1, y1], [x2, y2]) => x1 !== x2 || y1 !== y2)
  ).subscribe(([x, y]) => {
    this.#skew$.next({ x, y });
  })
  //#endregion
  //#region Transform
  #transform = new rxjs.BehaviorSubject<PIXI.Transform>(PIXI.Transform.IDENTITY);
  public get transorm(): PIXI.Transform { return this.displayObject.transform; }
  public set transform(value: PIXI.Transform) { this.displayObject.setTransform(value.position.x, value.position.y, value.scale.x, value.scale.y, value.rotation, value.skew.x, value.skew.y, value.pivot.x, value.pivot.y) }
  public readonly transform$ = this.#transform.asObservable();

  public invertTransform() {
    const inverse = this.displayObject.localTransform.invert();
    this.#transform.next(this.displayObject.transform);
    return inverse;
  }
  //#endregion

  //#region Filters
  #filters = new rxjs.BehaviorSubject<PIXI.Filter[]>([]);
  public get filters(): PIXI.Filter[] { return this.displayObject.filters ?? []; }
  public set filters(value: PIXI.Filter[]) {
    this.displayObject.filters = createProxyArray(value, this.filters$);
    this.#filters.next(this.displayObject.filters);
  }
  public readonly filters$ = this.#filters.asObservable();
  //#endregion

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected preRender() { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected postRender() { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onDestroy() { }


  /** Whether or not to render this object relative to screen space or world space */
  public screenSpace = true;


  //#region Construction
  constructor(displayObject: PIXI.DisplayObject, name?: string) {
    if (name) this.name = name;
    this._displayObject = displayObject;
    // Start out invisible so it can be displayed later
    this.visible = false;
    this.#position = createProxyPoint(this.displayObject.position, this.x$, this.y$);
    this.#skew = createProxyPoint(this.displayObject.skew, this.#skewX$, this.#skewY$);
    this.#pivot = createProxyPoint(this.displayObject.pivot, this.#pivotX$, this.#pivotY$);

    this.displayObject.filters = createProxyArray(this.displayObject.filters ?? [], this.filters$);

    canvas?.app?.renderer.addListener("prerender", () => { this.preRender(); });
    canvas?.app?.renderer.addListener("postrender", () => { this.postRender(); });

  }
  //#endregion
}
