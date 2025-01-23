import { CanvasNotInitializedError } from '../errors';
import { logError } from '../logging';
import { StageManager } from '../StageManager';
import { PanelStageObject } from '../stageobjects/PanelStageObject';
import { SerializedPanelStageObject } from '../types';
import { StageObjectApplication } from './StageObjectApplication';
import { StageObjectApplicationContext, StageObjectApplicationOptions, Tab } from './types';

export class PanelStageObjectApplication extends StageObjectApplication<PanelStageObject, SerializedPanelStageObject> {
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
  }



  protected prepareStageObject(): SerializedPanelStageObject {
    const prep = super.prepareStageObject();
    const bounds = this.originalObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;
    return {
      ...prep,
      bounds: {
        ...prep.bounds,
        width: this.originalObject.bounds.width * bounds.width,
        height: this.originalObject.bounds.height * bounds.height
      }
    }
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