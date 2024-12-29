/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const HANDLER_TYPES = [
  'apply',
  'construct',
  'defineProperty',
  'deleteProperty',
  'get',
  'getOwnPropertyDescriptor',
  'getPrototypeOf',
  'has',
  'isExtensible',
  'ownKeys',
  'preventExtensions',
  'set',
  'setPrototypeOf'
]

const HANDLER_KEYS = {
  get: 1,
  set: 1,
  deleteProperty: 1,
  has: 1,
  defineProperty: 1,
  getOwnPropertyDescriptor: 1,
}


export default function createProxy<t extends object = any>(rootTarget: t, handlers: ProxyHandler<t>, data?: Record<string, any>): { proxy: t, revoke: () => void } {
  const path = typeof data?.path === "string" ? data.path.split(".") : [];
  const userData: Record<string, any> = typeof data?.userData !== "undefined" ? data.userData : {};

  function innerCreate(inner: any, path: string[]): any {
    const context: Record<string, any> = {
      rootTarget,
      path,
      ...userData
    };

    const actualHandlers: Record<string, any> = {};
    for (const name of HANDLER_TYPES) {
      const keyParamIdx = (HANDLER_KEYS as any)[name];
      const handler = (handlers as any)[name];

      if (typeof handler !== "undefined") {
        if (typeof keyParamIdx !== "undefined") {

          actualHandlers[name] = function (...args: unknown[]) {
            const key = args[keyParamIdx] as string;
            context.nest = function (nestedTarget: any) {
              if (typeof nestedTarget === "undefined") nestedTarget = rootTarget;

              return innerCreate(nestedTarget, [
                ...path,
                key
              ]);
            };

            return handler.apply(context, args);
          }
        } else {
          actualHandlers[name] = function (...args: unknown[]) {
            context.nest = function (nestedTarget: any) {
              if (typeof nestedTarget === "undefined") nestedTarget = {};
              return innerCreate(nestedTarget, path);
            }

            return handler.apply(context, args);
          };
        }
      }
    }

    return Proxy.revocable(inner, actualHandlers);
  }
  return innerCreate(rootTarget, path);
}