import { StageManager } from '../StageManager';
import { TextStageObject } from '../stageobjects';
import { SerializedTextStageObject } from '../types';
import { getFontContext } from './functions';
import { StageObjectApplication } from './StageObjectApplication';
import { StageObjectApplicationContext, StageObjectApplicationOptions, Tab } from './types';

export class TextStageObjectApplication extends StageObjectApplication<TextStageObject, SerializedTextStageObject> {
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
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
      template: `templates/generic/form-footer.hbs`
    }
  }

  protected getTabs(): Record<string, Tab> {
    return {
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

  protected prepareStageObject(): SerializedTextStageObject {
    const prep = super.prepareStageObject();
    const bounds = this.originalObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    const style = {
      ...JSON.parse(JSON.stringify(PIXI.HTMLTextStyle.defaultStyle)) as Record<string, unknown>,
      ...prep.style,
    }

    if (typeof style.dropShadowAlpha === "number") style.dropShadowAlpha *= 100;
    if (typeof style.dropShadowAngle === "number") style.dropShadowAngle *= 100;

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

  protected parseFormData(data: Record<string, unknown>): SerializedTextStageObject {
    const parsed = super.parseFormData(data);

    if (typeof parsed.style.dropShadowAngle === "number") parsed.style.dropShadowAngle /= 100;
    if (typeof parsed.style.dropShadowAlpha === "number") parsed.style.dropShadowAlpha /= 100;
    return parsed;
  }

  protected _onRender(context: StageObjectApplicationContext, options: StageObjectApplicationOptions): void {
    super._onRender(context, options);
    const fontSize = this.element.querySelector(`input[name="style.fontSize"]`);
    if (fontSize instanceof HTMLInputElement) {
      fontSize.addEventListener("change", () => {
        // const textElem = this.element.querySelector(`input#text`);

        // const width = widthElem.value;
        // const height = heightElem.value;
        // const text = textElem.value;
        // // const metrics = PIXI.TextMetrics.measureText(text, new PIXI.TextStyle(this.stageObject.style));
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
}