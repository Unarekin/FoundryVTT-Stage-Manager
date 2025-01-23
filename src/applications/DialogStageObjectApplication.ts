import { DialogStageObject } from '../stageobjects';
import { SerializedDialogStageObject } from '../types';
import { StageObjectApplication } from './StageObjectApplication';
import { StageObjectApplicationContext, StageObjectApplicationOptions, Tab } from './types';
import { log, logError } from "../logging";
import { CanvasNotInitializedError } from '../errors';
import { StageManager } from '../StageManager';
import { getFontContext } from './functions';

export class DialogStageObjectApplication extends StageObjectApplication<DialogStageObject, SerializedDialogStageObject> {
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
    },
    panel: {
      template: `modules/${__MODULE_ID__}/templates/editObject/panel.hbs`
    },
    text: {
      template: `modules/${__MODULE_ID__}/templates/editObject/text.hbs`
    },
    font: {
      template: `modules/${__MODULE_ID__}/templates/editObject/font.hbs`
    },
    triggers: {
      template: `modules/${__MODULE_ID__}/templates/editObject/triggers.hbs`
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  }

  protected getTabs(): Record<string, Tab> {
    return {
      panel: {
        id: "panel",
        icon: "fas fa-window-maximize",
        label: "STAGEMANAGER.TABS.PANEL",
        active: false,
        cssClass: "",
        group: "primary"
      },
      text: {
        id: "text",
        icon: "fas fa-paragraph",
        label: "STAGEMANAGER.TABS.TEXT",
        active: false,
        cssClass: "",
        group: "primary"
      },
      font: {
        id: "font",
        icon: "fas fa-font",
        label: "STAGEMANAGER.TABS.FONT",
        active: false,
        cssClass: "",
        group: "primary"
      }
    }
  }

  protected drawPreview() {
    try {
      if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
      const previewCanvas = this.element.querySelector("#PanelPreview");
      if (!(previewCanvas instanceof HTMLCanvasElement)) throw new CanvasNotInitializedError();

      const { width, height } = this.stageObject.displayObject.texture;

      previewCanvas.width = width;
      previewCanvas.height = height;

      const ctx = previewCanvas.getContext("2d");
      if (!ctx) throw new CanvasNotInitializedError();

      // const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(this.stageObject.displayObject));


      const sprite = new PIXI.Sprite(this.stageObject.displayObject.texture.clone());
      const rt = PIXI.RenderTexture.create({ width: sprite.width, height: sprite.height });
      canvas.app.renderer.render(sprite, { renderTexture: rt, skipUpdateTransform: true, clear: false });

      const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(rt));
      sprite.destroy();

      const imageData = new ImageData(pixels, width, height);
      ctx.putImageData(imageData, 0, 0);

      const { left, right, top, bottom } = this.stageObject.borders;

      ctx.beginPath();

      // Left column
      ctx.moveTo(left, 0);
      ctx.lineTo(left, height);

      // Top row
      ctx.moveTo(0, top);
      ctx.lineTo(width, top);

      // Right column
      ctx.moveTo(width - right, 0);
      ctx.lineTo(width - right, height);

      // Bottom row
      ctx.moveTo(0, height - bottom);
      ctx.lineTo(width, height - bottom);

      ctx.strokeStyle = "red";
      ctx.stroke();

    } catch (err) {
      logError(err as Error);
    }
  }

  protected _onRender(context: StageObjectApplicationContext, options: StageObjectApplicationOptions): void {
    super._onRender(context, options);
    this.drawPreview();

    const fontSize = this.element.querySelector(`input[name="style.fontSize"]`);
    if (fontSize instanceof HTMLInputElement) {
      fontSize.addEventListener("change", () => {
        const form = this.element instanceof HTMLFormElement ? this.element : this.element.querySelector("form");

        if (form instanceof HTMLFormElement) {
          const serialized = this.parseFormData(new FormDataExtended(form).object);
          const metrics = PIXI.TextMetrics.measureText(serialized.text, new PIXI.TextStyle(serialized.style));
          const widthElem = this.element.querySelector(`input[name="bounds.width"]`);
          const heightElem = this.element.querySelector(`input[name="bounds.height"]`);
          if (!(widthElem instanceof HTMLInputElement && heightElem instanceof HTMLInputElement)) return;
          widthElem.value = metrics.width.toString();
          heightElem.value = metrics.height.toString();
        }

      })
    }

  }

  protected prepareStageObject(): SerializedDialogStageObject {
    const prep = super.prepareStageObject();
    const bounds = this.originalObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    const style = {
      ...JSON.parse(JSON.stringify(PIXI.HTMLTextStyle.defaultStyle)) as Record<string, unknown>,
      ...prep.style
    }

    return {
      ...prep,
      bounds: {
        ...prep.bounds,
        width: this.originalObject.bounds.width * bounds.width,
        height: this.originalObject.bounds.height * bounds.height
      },
      style
    }
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<StageObjectApplicationContext> {
    const context = await super._prepareContext(options);
    const newContext = {
      ...context,
      ...getFontContext(this.stageObject.serialize())
    }
    return newContext;
  }

  protected trimArrayElement(data: Record<string, any>, key: string): Record<string, any> {
    if (Array.isArray(data[key]))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data[key] = data[key][0];
    return data;
  }

  protected parseFormData(data: Record<string, any>): SerializedDialogStageObject {
    log("Parsing:", { ...data });

    this.trimArrayElement(data, "bounds.width");
    this.trimArrayElement(data, "bounds.height");
    this.trimArrayElement(data, "skew.x");
    this.trimArrayElement(data, "skew.y");
    this.trimArrayElement(data, "alpha");
    this.trimArrayElement(data, "angle");

    const parsed = super.parseFormData(data);
    if (typeof parsed.style.dropShadowAngle === "number") parsed.style.dropShadowAngle /= 100;
    if (typeof parsed.style.dropShadowAlpha === "number") parsed.style.dropShadowAlpha /= 100;

    return parsed;
  }

  _onChangeForm(): void {
    super._onChangeForm();
    const form = this.element instanceof HTMLFormElement ? new FormDataExtended(this.element) : new FormDataExtended($(this.element).find("form")[0]);
    const data = this.parseFormData(form.object);
    if (this.ghost instanceof PIXI.Sprite) {
      if (this.ghost.texture.baseTexture.resource.src !== data.src)
        this.ghost.texture = PIXI.Texture.from(data.src);
    }
    this.drawPreview();
  }

}