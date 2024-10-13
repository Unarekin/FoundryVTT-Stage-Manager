import BackgroundLayer from "./rom/background_layer";
import data from "./truncated_backgrounds.js";
import ROM from "./rom/rom";
import { InvalidContextError } from '../../errors';

const backgroundData = new Uint8Array(
  Array.from(data).map((x) => x.charCodeAt(0))
);


export const SNES_WIDTH = 256;
export const SNES_HEIGHT = 224;

export default class Engine {

  #layer1: BackgroundLayer;
  #layer2: BackgroundLayer;
  #rom = new ROM(backgroundData);
  #context: CanvasRenderingContext2D | null;

  public get layer1() { return this.#layer1.entry as number; }
  public set layer1(value: number) { this.#layer1 = new BackgroundLayer(value, this.#rom); }

  public get layer2() { return this.#layer2.entry as number; }
  public set layer2(value: number) { this.#layer2 = new BackgroundLayer(value, this.#rom); }

  public drawFrame(tick: number) {
    if (!this.#context) throw new InvalidContextError();
    const image = this.#context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const alpha1: number = this.#layer1.entry ? 1 : 0;
    const alpha2: number = this.#layer2.entry ? 0 : 1;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let bitmap = this.#layer1.overlayFrame(image.data, 0, tick, alpha1, true);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    bitmap = this.#layer2.overlayFrame(image.data, 0, tick, alpha2, false);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    image.data.set(bitmap);
    this.#context.putImageData(image, 0, 0);
  }

  constructor(private canvas: HTMLCanvasElement, layer1: number, layer2: number) {
    this.#layer1 = new BackgroundLayer(layer1, this.#rom);
    this.#layer2 = new BackgroundLayer(layer2, this.#rom);
    this.#context = canvas.getContext("2d", { willReadFrequently: true });
  }
}
