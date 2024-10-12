export default function createProxySize(original: Size, w$: rxjs.Subject<number>, h$: rxjs.Subject<number>): Point {
  return new Proxy(original, {
    get: (target, prop, receiver) => Reflect.get(target, prop, receiver),
    set: (target, prop, value, receiver) => {
      if (prop === "width") w$.next(value);
      else if (prop === "height") h$.next(value);
      return Reflect.set(target, prop, value, receiver);
    }
  })
}