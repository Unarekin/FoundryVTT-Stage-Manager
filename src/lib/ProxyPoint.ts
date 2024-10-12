export default function createProxyPoint(original: Point, x$: rxjs.Subject<number>, y$: rxjs.Subject<number>): Point {
  return new Proxy(original, {
    get: (target, prop, receiver) => Reflect.get(target, prop, receiver),
    set: (target, prop, value, receiver) => {
      if (prop === "x") x$.next(value);
      else if (prop === "y") y$.next(value);

      return Reflect.set(target, prop, value, receiver);
    }
  })
}