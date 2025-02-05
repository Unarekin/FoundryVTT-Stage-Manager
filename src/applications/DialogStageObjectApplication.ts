import { AnyObject, DeepPartial } from 'Foundry-VTT/src/types/utils.mjs';
import { CanvasNotInitializedError } from '../errors';
import { logError } from '../logging';
import { DialogStageObject } from '../stageobjects';
import { SerializedDialogStageObject } from '../types';
import { getFontContext } from './functions';
import { StageObjectApplication } from './StageObjectApplication';
import { StageObjectApplicationContext, StageObjectApplicationOptions, Tab } from './types';

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
      template: `modules/${__MODULE_ID__}/templates/editObject/dialogText.hbs`
    },
    portrait: {
      template: `modules/${__MODULE_ID__}/templates/editObject/image.hbs`
    },
    effects: {
      template: `modules/${__MODULE_ID__}/templates/editObject/effects.hbs`
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
      image: {
        id: "image",
        icon: "fas fa-image",
        label: "STAGEMANAGER.TABS.PORTRAIT",
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

      const { width, height } = this.stageObject.panelObject.displayObject.texture;

      previewCanvas.width = width;
      previewCanvas.height = height;

      const ctx = previewCanvas.getContext("2d");
      if (!ctx) throw new CanvasNotInitializedError();

      // const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(this.stageObject.displayObject));


      const sprite = new PIXI.Sprite(this.stageObject.panelObject.displayObject.texture.clone());
      const rt = PIXI.RenderTexture.create({ width: sprite.width, height: sprite.height });
      canvas.app.renderer.render(sprite, { renderTexture: rt, skipUpdateTransform: true, clear: false });

      const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(rt));
      sprite.destroy();

      const imageData = new ImageData(pixels, width, height);
      ctx.putImageData(imageData, 0, 0);

      const { left, right, top, bottom } = this.stageObject.panelObject.borders;

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
          const metrics = PIXI.TextMetrics.measureText(serialized.text.text, new PIXI.TextStyle(serialized.text.style));
          const widthElem = this.element.querySelector(`input[name="bounds.width"]`);
          const heightElem = this.element.querySelector(`input[name="bounds.height"]`);
          if (!(widthElem instanceof HTMLInputElement && heightElem instanceof HTMLInputElement)) return;
          widthElem.value = metrics.width.toString();
          heightElem.value = metrics.height.toString();
        }
      });
    }
  }



  protected prepareStageObject(): SerializedDialogStageObject {
    const prep = super.prepareStageObject();
    // const bounds = this.originalObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    // log("Prep:", prep);

    // prep.panel.bounds = this.boundsToScreen(prep.panel.bounds);
    // prep.portrait.bounds = this.boundsToScreen(prep.portrait.bounds);
    // prep.text.bounds = this.boundsToScreen(prep.text.bounds);

    const style = {
      ...JSON.parse(JSON.stringify(PIXI.HTMLTextStyle.defaultStyle)) as Record<string, unknown>,
      ...prep.text.style,
    }

    if (typeof style.dropShadowAlpha === "number") style.dropShadowAlpha *= 100;
    if (typeof style.dropShadowAngle === "number") style.dropShadowAngle *= 100;

    return {
      ...prep,
      text: {
        ...prep.text,
        bounds: this.boundsToScreen(prep.text.bounds),
        style
      },
      panel: {
        ...prep.panel,
        bounds: this.boundsToScreen(prep.panel.bounds)
      },
      portrait: {
        ...prep.portrait,
        bounds: this.boundsToScreen(prep.portrait.bounds)
      },
      // bounds: this.boundsToScreen(prep.bounds)
    }
  }

  _onChangeForm(): void {
    super._onChangeForm();
    const form = this.element instanceof HTMLFormElement ? new FormDataExtended(this.element) : new FormDataExtended($(this.element).find("form")[0]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = this.parseFormData(form.object);

    const panel = this.ghost?.children?.find(child => child instanceof PIXI.NineSlicePlane);
    const portrait = this.ghost?.children?.find(child => child instanceof PIXI.Sprite);
    const text = this.ghost?.children?.find(child => child instanceof PIXI.HTMLText);

    if (panel) {
      // empty
    }

    if (portrait) {
      // empty
    }

    if (text) {
      // empty
    }

    // if (this.ghost instanceof PIXI.Sprite) {
    //   if (this.ghost.texture.baseTexture.resource.src !== data.panel.src)
    //     this.ghost.texture = PIXI.Texture.from(data.panel.src);
    // }
    this.drawPreview();
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<StageObjectApplicationContext> {
    const context = await super._prepareContext(options);

    return {
      ...context,
      ...getFontContext(this.stageObject.serialize())
    }
  }

  protected onRevert(): SerializedDialogStageObject {
    const reverted = super.onRevert() as SerializedDialogStageObject;
    // reverted.panel.bounds = this.normalizeBounds(reverted.panel.bounds);
    // reverted.portrait.bounds = this.normalizeBounds(reverted.portrait.bounds);
    reverted.text.bounds = this.stageObject.textObject.serialize().bounds;
    // reverted.text.bounds = this.normalizeBounds(reverted.text.bounds);

    return reverted;
  }

  protected async _preparePartContext(partId: string, context: this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown, options: DeepPartial<foundry.applications.api.HandlebarsApplicationMixin.HandlebarsRenderOptions>): Promise<this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown> {

    const partContext = await super._preparePartContext(partId, context, options) as Record<string, unknown>;

    const stageObject = this.prepareStageObject();

    switch (partId) {
      case "text":
      case "font":
        partContext.formPrefix = "text.";
        partContext.stageObject = stageObject.text;
        partContext.textTabs = {
          text: {
            id: "text",
            icon: "fas fa-paragraph",
            label: "STAGEMANAGER.TABS.TEXT",
            active: true,
            cssClass: "active",
            group: "text"
          },
          font: {
            id: "font",
            icon: "fas fa-font",
            label: "STAGEMANAGER.TABS.FONT",
            active: false,
            cssClass: "",
            group: "text"
          },
        };
        break;
      case "panel":
        partContext.formPrefix = "panel.";
        partContext.stageObject = stageObject.panel;
        break;
      case "portrait":
        partContext.formPrefix = "portrait.";
        partContext.stageObject = stageObject.portrait;
        partContext.showPortraitCheck = true;
        partContext.showPortrait = stageObject.showPortrait;
        break;
      default:
        partContext.stageObject = stageObject;
    }

    // log("Part context:", partId, { ...context, ...partContext })

    return Promise.resolve({
      ...context,
      ...partContext
    });
  }

  protected parseFormData(data: Record<string, unknown>): SerializedDialogStageObject {
    const parsed = super.parseFormData(data);

    if (typeof parsed.text.style.dropShadowAngle === "number") parsed.text.style.dropShadowAngle /= 100;
    if (typeof parsed.text.style.dropShadowAlpha === "number") parsed.text.style.dropShadowAlpha /= 100;

    parsed.portrait.bounds = this.normalizeBounds(parsed.portrait.bounds);
    parsed.panel.bounds = this.normalizeBounds(parsed.panel.bounds);
    parsed.text.bounds = this.normalizeBounds(parsed.text.bounds);


    parsed.bounds.width = parsed.panel.bounds.width;
    parsed.bounds.height = parsed.panel.bounds.height;
    parsed.skew = { x: 0, y: 0 };

    const serialized = this.stageObject.serialize();
    parsed.panel.id = serialized.panel.id ?? foundry.utils.randomID();
    parsed.portrait.id = serialized.portrait.id ?? foundry.utils.randomID();
    parsed.text.id = serialized.text.id ?? foundry.utils.randomID();

    parsed.angle = parsed.panel.angle;
    parsed.alpha = parsed.panel.alpha;

    return parsed;
  }

}