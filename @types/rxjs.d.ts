// declare const rxjs = await import("../node_modules/rxjs/dist/types/index.d.ts");
import * as _rxjs from "../node_modules/rxjs/dist/types/index";

declare global {
  const rxjs: typeof _rxjs;
}