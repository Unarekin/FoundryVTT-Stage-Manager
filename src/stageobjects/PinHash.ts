export type PinHashCallback = (left: boolean, right: boolean, top: boolean, bottom: boolean) => void;

export class PinHash {
  #left = false;
  #right = false;
  #top = false;
  #bottom = false;

  public get left() { return this.#left; }
  public set left(val) {
    this.#left = val;
    this.#callCB();
  }

  public get right() { return this.#right; }
  public set right(val) {
    this.#right = val;
    this.#callCB();
  }

  public get top() { return this.#top; }
  public set top(val) {
    this.#top = val;
    this.#callCB();
  }

  public get bottom() { return this.#bottom; }
  public set bottom(val) {
    this.#bottom = val;
    this.#callCB();
  }


  #cb: PinHashCallback
  #callCB() {
    this.#cb(this.left, this.right, this.top, this.bottom);
  }
  constructor(cb: PinHashCallback) {
    this.#cb = cb;
  }
}