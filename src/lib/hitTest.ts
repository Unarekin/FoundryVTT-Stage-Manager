import { StageObject } from "../stageobjects";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function hitTestFn(wrapped: Function, target: PIXI.DisplayObject, pos: PIXI.Point): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const stageObject: StageObject = (target as any).stageObject;
  if (stageObject instanceof StageObject) {
    // Ignore mouse events if not on this layer's select tool and clickThrough is true
    if (stageObject.clickThrough && game.activeTool != stageObject.selectTool) return false;

    // Check if point is in object bounds
    if (!target.getBounds(true).contains(pos.x, pos.y)) return false;

    // Check pixel
    const localPos = target.toLocal(pos);
    if (!canvas?.app) return false;

    const pixel = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(target, new PIXI.Rectangle(localPos.x, localPos.y, 1, 1)));
    const color = new PIXI.Color(pixel);
    return !!color.alpha
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return wrapped(target, pos);
}
