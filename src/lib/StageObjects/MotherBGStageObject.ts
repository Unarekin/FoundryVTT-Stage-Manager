import { CanvasStageObject } from "./CanvasStageObject";
import presets from "../ebb/presets"
import Engine from "../ebb/engine";

export class MotherBGStageObject extends CanvasStageObject {
  #canvas: HTMLCanvasElement;
  #renderEngine: Engine;

  #frameCount = 0;
  #frameTime = Date.now();
  #tick = 0;
  #lastDraw = Date.now();

  public readonly layerPresets = presets;

  #layer1 = new rxjs.BehaviorSubject<number>(0);
  public get layer1() { return this.#renderEngine.layer1; }
  public set layer1(value: number) {
    this.#renderEngine.layer1 = value;
    this.#layer1.next(value);
    this.#canvas.dataset.layer1 = value.toString();
  }
  public readonly layer1$ = this.#layer1.asObservable();

  #layer2 = new rxjs.BehaviorSubject<number>(0);
  public get layer2() { return this.#renderEngine.layer2; }
  public set layer2(value: number) {
    this.#renderEngine.layer2 = value;
    this.#layer2.next(value);
    this.#canvas.dataset.layer2 = value.toString();
  }
  public readonly layer2$ = this.#layer2.asObservable();


  #fps = new rxjs.BehaviorSubject<number>(0);
  public get fps() { return this.#fps.value; }
  public readonly fps$ = this.#fps.asObservable();

  protected preRender(): void {
    const timeSince = Date.now() - this.#lastDraw;

    if (this.visible && timeSince >= 20) {

      this.#renderEngine.drawFrame(this.#tick);
      this.#tick += 1;
      this.#frameCount++;
      this.#lastDraw = Date.now();

      if (Date.now() - this.#frameTime >= 1000) {
        this.#frameTime = Date.now();
        this.#fps.next(this.#frameCount);
        this.#frameCount = 0;
      }
    }
    super.preRender();
  }

  override destroy(): void {
    this.visible = false;
    super.destroy();
  }


  constructor(layer1: number, layer2: number)
  constructor(layers: [number, number])
  constructor(...args: unknown[]) {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const layer1: number = typeof args[0] === "number" ? args[0] : (args[0] as any)[0] as number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const layer2: number = typeof args[1] === "number" ? args[1] : (args[0] as any)[1] as number;
    const canvas = document.createElement("canvas");

    canvas.width = 256;
    canvas.height = 224;

    canvas.dataset.layer1 = layer1.toString();
    canvas.dataset.layer2 = layer2.toString();
    super(canvas);
    this.#canvas = canvas;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    this.#renderEngine = new Engine(canvas, layer1, layer2);
  }
}