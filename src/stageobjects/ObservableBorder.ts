import { Border } from "types";

export type BorderCallback = (left: number, right: number, top: number, bottom: number) => void;

export class ObservableBorder {

  #left = 0;
  #right = 0;
  #top = 0;
  #bottom = 0;

  #cb: BorderCallback;

  public set(val: number | Partial<Border>): boolean {
    if (typeof val === "number" && (this.left !== val || this.right !== val || this.top !== val || this.bottom !== val)) {
      this.left = this.right = this.top = this.bottom = val;
      return true;
    } else if (typeof val !== "number") {
      let changed = false;
      if (typeof val.left === "number" && this.left !== val.left) {
        changed = true;
        this.left = val.left;
      }

      if (typeof val.right === "number" && this.right !== val.right) {
        changed = true;
        this.right = val.right;
      }

      if (typeof val.top === "number" && this.top !== val.top) {
        changed = true;
        this.top = val.top;
      }

      if (typeof val.bottom === "number" && this.bottom !== val.bottom) {
        changed=true;
        this.bottom = val.bottom;
      }

      return changed;
    } else {
      return false;
    }
  }

  public get left() { return this.#left; }
  public set left(val) {
    if (val !== this.left) {
      this.#left = val;
      this.#callCallback();
    }
  }

  public get right() { return this.#right; }
  public set right(val) {
    if (val !== this.right) {
      this.#right = val;
      this.#callCallback();
    }
  }

  public get top() { return this.#top; }
  public set top(val) {
    if (val !== this.top) {
      this.#top = val;
      this.#callCallback();
    }
  }

  public get bottom() { return this.#bottom; }
  public set bottom(val) {
    if (val !== this.bottom) {
      this.#bottom = val;
      this.#callCallback();
    }
  }

  #callCallback() { this.#cb(this.#left, this.#right, this.#top, this.#bottom); }

  constructor(left: number, right: number, top: number, bottom: number, cb: BorderCallback) {
    this.#left = left;
    this.#right = right;
    this.#top = top;
    this.#bottom = bottom;
    this.#cb = cb;
  }
}
