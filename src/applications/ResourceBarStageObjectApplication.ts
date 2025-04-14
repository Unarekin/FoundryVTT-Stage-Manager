import { SerializedResourceBarStageObject } from 'types';
import { ResourceBarStageObject } from 'stageobjects';
import { ProgressBarStageObjectApplication } from './ProgressBarStageObjectApplication';
import { EmptyObject } from 'Foundry-VTT/src/types/utils.mjs';
import { logError } from 'logging';
import { pathPresetSelect, setPresetValues } from './functions';

export class ResourceBarStageObjectApplication extends ProgressBarStageObjectApplication<ResourceBarStageObject, SerializedResourceBarStageObject> {
  public static readonly PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...ResourceBarStageObjectApplication.FRONT_PARTS,
    progressBar: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.hbs`
    },
    settings: {
      template: `modules/${__MODULE_ID__}/templates/editObject/resourceBar.settings.hbs`
    },
    font: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.font.hbs`
    },
    foreground: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.fg.hbs`
    },
    background: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.bg.hbs`
    },
    lerp: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.lerp.hbs`
    },
    ...ResourceBarStageObjectApplication.BACK_PARTS
  }

  protected _onRender(context: Record<string, undefined>, options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): void {
    super._onRender(context, options);

    this.loadUUIDPreview();

    const uuidElem = this.element.querySelector(`[data-role="object-uuid"]`);
    if (uuidElem instanceof HTMLInputElement) {
      uuidElem.addEventListener("input", () => { this.loadUUIDPreview(); });
    }

    const presetSelect = this.element.querySelector(`#pathPreset`);
    if (presetSelect instanceof HTMLSelectElement) {
      setPresetValues(this.element);
      presetSelect.addEventListener("input", () => { setPresetValues(this.element); });
    }
  }

  protected loadUUIDPreview() {
    const uuidElem = this.element.querySelector(`[data-role="object-uuid"]`);
    if (uuidElem instanceof HTMLInputElement) {
      if (uuidElem.value) {
        fromUuid(uuidElem.value).then((obj: any) => {
          const name = this.element.querySelector(`[data-role="object-name"]`);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (name instanceof HTMLElement) name.innerHTML = obj.name as string;
        })
          .catch((err: Error) => { logError(err); })
      }
    }
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>;

    const serialized = context.stageObject as SerializedResourceBarStageObject;

    const presets = pathPresetSelect(serialized.object);
    context.pathPresetSelect = presets;
    context.hasPresets = Object.keys(presets).length > 0;

    return context as EmptyObject;
  }
}