export default function createProxyArray<t = unknown>(arr: t[], obs$: rxjs.Subject<t[]>) {
  const hooks: (string | symbol)[] = [
    "push",
    "pop",
    "shift",
    "unshift",
    "slice",
    "splice"
  ];
  return new Proxy(arr, {
    get(target: t[], prop: string | symbol, receiver: any) {
      if (hooks.includes(prop)) {
        return function (...args: unknown[]) {
          let res = Reflect.apply(target[prop], target, args);
          obs$.next(target);
          return res;
        }
      }
    }

  })
}

