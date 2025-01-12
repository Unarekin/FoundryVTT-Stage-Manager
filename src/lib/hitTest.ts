import { StageObject } from "../stageobjects";


// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function hitTestFn(wrapped: Function, target: PIXI.DisplayObject, pos: PIXI.Point): boolean {



  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const stageObject: StageObject = (target as any).stageObject;


  if (stageObject instanceof StageObject) {

    // let output = document.getElementById("debugOut");
    // if (!(output instanceof HTMLDivElement)) {
    //   output = document.createElement("div");
    //   output.setAttribute("id", "debugOut");
    //   output.style.position = "absolute";
    //   output.style.left = "0";
    //   output.style.top = "0";
    //   output.style.width = "200px";
    //   output.style.height = "200px";
    //   output.style.zIndex = "5000";
    //   output.style.color = "white";
    //   output.style.textShadow = "1px 1px 2px black"
    //   document.body.appendChild(output);
    // }

    const local = stageObject.displayObject.toLocal(pos);
    const color = stageObject.getPixelColor(local.x, local.y);

    // output.innerHTML = [
    //   `Position: ${Math.floor(pos.x)}, ${Math.floor(pos.y)}`,
    //   `Local: ${Math.floor(local.x)}, ${Math.floor(local.y)}`,
    //   `Background: ${color.toHexa()}`
    // ].join("<br>");

    // output.style.background = color.alpha ? color.toHexa() : "#000000aa";
    return color.alpha !== 0;
    // return hitResult;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return wrapped(target, pos);
}