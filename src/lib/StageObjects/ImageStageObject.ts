import { InvalidFormDataError, InvalidURLError } from "../../errors";
import { log } from "../../logging";
import { StageObject } from "./StageObject";
import mime from "mime";

export class ImageStageObject extends StageObject {

  protected override _displayObject: PIXI.Sprite;
  public override get displayObject() { return this._displayObject; }

  //#region Sizing
  #width = new rxjs.BehaviorSubject<number>(0);
  public get width(): number { return this.displayObject.width; }
  public set width(value: number) {
    this.displayObject.width = value;
    this.#width.next(value);
  }
  public readonly width$ = this.#width.asObservable();

  #height = new rxjs.BehaviorSubject<number>(0);
  public get height(): number { return this.displayObject.height; }
  public set height(value: number) {
    this.displayObject.height = value;
    this.#height.next(value);
  }
  public readonly height$ = this.#height.asObservable();
  //#endregion

  //#region Drawing
  #blendMode = new rxjs.BehaviorSubject<PIXI.BLEND_MODES>(PIXI.BLEND_MODES.NORMAL);
  public get blendMode(): PIXI.BLEND_MODES { return this.displayObject.blendMode; }
  public set blendMode(value: PIXI.BLEND_MODES) {
    this.displayObject.blendMode = value;
    this.#blendMode.next(value);
  }
  public readonly blendMode$ = this.#blendMode.asObservable();

  #tint = new rxjs.BehaviorSubject<PIXI.ColorSource>(0xFFFFFF);
  public get tint(): PIXI.ColorSource { return this.displayObject.tint; }
  public set tint(value: PIXI.ColorSource) {
    this.displayObject.tint = value;
    this.#tint.next(value);
  }
  public readonly tint$ = this.#tint.asObservable();

  #roundPixels = new rxjs.BehaviorSubject<boolean>(false);
  public get roundPixels(): boolean { return this.displayObject.roundPixels; }
  public set roundPixels(value: boolean) {
    this.displayObject.roundPixels = value;
    this.#roundPixels.next(value);
  }
  public readonly roundPixels$ = this.#roundPixels.asObservable();

  //#endregion

  #anchor = new rxjs.BehaviorSubject<Point>({ x: 0, y: 0 });
  public get anchor(): Point { return this.displayObject.anchor; }
  public set anchor(value: Point) {
    this.displayObject.anchor.x = value.x;
    this.displayObject.anchor.y = value.y;
    this.#anchor.next(value);
  }
  public readonly anchor$ = this.#anchor.asObservable();


  static async fromDialog(useDialogV2: boolean): Promise<ImageStageObject | void> {
    if (useDialogV2) {
      return fromDialogV2();
    } else {
      return fromDialogV1();
    }
  }

  constructor(source: PIXI.SpriteSource, name?: string) {
    let sprite: PIXI.Sprite | null = null;
    if (typeof source === "string") {
      const mimeType = mime.getType(source);

      if (typeof mimeType === "string") {
        const split = mimeType?.split("/");
        if (split[0] === "video") {
          // Create a PIXI.Sprite from a video element to ensure it plays
          const vid = document.createElement("video");
          vid.src = source;
          vid.autoplay = true;
          vid.loop = true;
          sprite = PIXI.Sprite.from(vid);
        } else if (split[1] === "gif") {
          sprite = new PIXI.Sprite();;

          PIXI.Assets.load(source)
            .then(asset => {
              this._displayObject.addChild(asset);
            }).catch(console.error);
        }
      }
    }
    if (!sprite) sprite = PIXI.Sprite.from(source);
    super(sprite, name);
    this._displayObject = sprite;
  }
}

function parseFormResponse(elem: JQuery<HTMLElement>): ImageStageObject | void {
  const formData = elem.find("form").serializeArray();
  if (!formData) throw new InvalidFormDataError();
  const url = formData.find(elem => elem.name === "imagePath")?.value ?? "";
  if (!url) throw new InvalidURLError(url);
  const name = formData.find(elem => elem.name === "name")?.value ?? url.split("/").slice(-1)[0].split(".")[0];

  return new ImageStageObject(url, name);
}

function addEventListeners(html: JQuery<HTMLElement>) {
  html.find("#filePicker").on("change", (e) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    html.find("#imagePath").val((e.currentTarget as any).value as string);
  })
}

async function fromDialogV1(): Promise<ImageStageObject | void> {
  return renderTemplate(`/modules/${__MODULE_ID__}/templates/dialogs/add-image.hbs`, {})
    .then(content => new Promise((resolve, reject) => {
      new Dialog({
        title: game.i18n?.localize("STAGEMANAGER.DIALOGS.ADDIMAGE.TITLE") ?? "",
        content,
        default: "ok",
        buttons: {
          cancel: {
            label: game.i18n?.localize("STAGEMANAGER.DIALOGS.BUTTONS.CANCEL") ?? "",
            icon: "<i class='fas fa-times'></i>"
          },
          ok: {
            label: game.i18n?.localize("STAGEMANAGER.DIALOGS.BUTTONS.OK") ?? "",
            icon: "<i class='fas fa-check'></i>",
            callback: html => {
              try {
                resolve(parseFormResponse((html instanceof HTMLElement) ? $(html) : html));
              } catch (err) {
                reject(err as Error);
              }
            }
          }
        },
        render(e: HTMLElement | JQuery<HTMLElement>) {
          addEventListeners((e instanceof HTMLElement) ? $(e) : e);
        }
      }).render(true);
    }))
}

async function fromDialogV2(): Promise<ImageStageObject | void> {

  const content = await renderTemplate(`/modules/${__MODULE_ID__}/templates/dialogs/add-image.hbs`, {});
  const response = await foundry.applications.api.DialogV2.wait({
    window: {
      title: "STAGEMANAGER.DIALOGS.ADDIMAGE.TITLE"
    },
    content,
    render(event, dialog) {
      addEventListeners($(dialog));
    },
    buttons: [
      {
        icon: "fas fa-times",
        label: "STAGEMANAGER.DIALOGS.BUTTONS.CANCEL",
        action: "cancel"
      },
      {
        icon: "fas fa-check",
        label: "STAGEMANAGER.DIALOGS.BUTTONS.OK",
        action: "ok",
        // eslint-disable-next-line @typescript-eslint/require-await
        callback: async (event, button, dialog) => parseFormResponse($(dialog))

      }
    ]
  });
  if (response) return response;
  else return;
}