export class ActorDock {
  public id: string = foundry.utils.randomID();

  #portraitSprite: PIXI.Sprite | null = null;

  public get portraitSprite(): PIXI.Sprite | null {
    return this.#portraitSprite;
  }

  constructor(public name: string, public portrait: string) {


    this.setPortraitImage(portrait).catch(console.error);
  }

  public setPortraitImage(image: string): Promise<void>
  public setPortraitImage(texture: PIXI.Texture): void
  public setPortraitImage(arg: string | PIXI.Texture): void | Promise<void> {
    if (typeof arg === "string") {
      return loadTexture(arg)
        .then(val => {
          if (!val) throw new Error();
          if (val instanceof PIXI.Texture) return this.setPortraitImage(val);
          else throw new Error();
        })
    } else {
      if (this.#portraitSprite) this.#portraitSprite.texture = arg;
      else this.#portraitSprite = new PIXI.Sprite(arg);
    }
  }
}