import { StageObject } from "../stageobjects";


// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function hitTestFn(wrapped: Function, target: PIXI.DisplayObject, pos: PIXI.Point): boolean {



  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const stageObject: StageObject = (target as any).stageObject;


  if (stageObject instanceof StageObject) {

    const local = stageObject.displayObject.toLocal(pos);
    const color = stageObject.getPixelColor(local.x, local.y);

    // log("HitTest:", color.toHexa());

    // output.style.background = color.alpha ? color.toHexa() : "#000000aa";
    return color.alpha !== 0;
    // return hitResult;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return wrapped(target, pos);
}