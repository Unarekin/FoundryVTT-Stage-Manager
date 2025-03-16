import { StageObject } from "../stageobjects";


// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function hitTestFn(wrapped: Function, target: PIXI.DisplayObject, pos: PIXI.Point): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const stageObject: StageObject = (target as any).stageObject;

  if (stageObject instanceof StageObject) {
    // console.groupCollapsed("hitTestFn:", stageObject.name);
    // try {

    // Course check
    if (!target.getBounds(true).contains(pos.x, pos.y)) {
      // log("Not in bounds");
      return false;
    }
    if (game.activeTool !== stageObject.selectTool && stageObject.clickThrough) {
      // log("Clickthrough");
      return false;
    }

    const local = stageObject.displayObject.toLocal(pos);
    const color = stageObject.getPixelColor(local.x, local.y);


    // log("Color:", color.toHexa())
    // output.style.background = color.alpha ? color.toHexa() : "#000000aa";
    const alpha = color.alpha !== 0;
    // console.log("Alpha:", alpha);
    // return hitResult;
    return alpha;
    // } finally {
    //   console.groupEnd();
    // }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return wrapped(target, pos);

}