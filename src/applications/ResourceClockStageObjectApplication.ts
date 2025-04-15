import { ResourceClockStageObject } from "stageobjects";
import { SerializedResourceClockStageObject } from "types";
import { ProgressClockStageObjectApplication } from "./ProgressClockStageObjectApplication";
import { EmptyObject } from 'Foundry-VTT/src/types/utils.mjs';
import { pathPresetSelect, setPathSuggestions, setPresetValues, updatePresetValues } from "./functions";
import { logError } from "logging";

export class ResourceClockStageObjectApplication extends ProgressClockStageObjectApplication<ResourceClockStageObject, SerializedResourceClockStageObject> {
  public static readonly PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...ResourceClockStageObjectApplication.FRONT_PARTS,
    progressBar: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.hbs`
    },
    settings: {
      template: `modules/${__MODULE_ID__}/templates/editObject/resourceClock.settings.hbs`
    },
    text: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressClock.font.hbs`
    },
    bg: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressClock.bg.hbs`
    },
    fg: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressClock.fg.hbs`
    },
    lerp: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressClock.lerp.hbs`
    },
    ...ResourceClockStageObjectApplication.BACK_PARTS
  };

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>;

    const serialized = context.stageObject as SerializedResourceClockStageObject;

    const presets = pathPresetSelect(serialized.object);
    context.pathPresetSelect = presets;
    context.hasPresets = Object.keys(presets).length > 0;

    return context as EmptyObject;
  }

  protected _onRender(context: Record<string, undefined>, options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): void {
    super._onRender(context, options);

    this.loadUUIDPreview();

    const uuidElem = this.element.querySelector(`[data-role="object-uuid"]`);
    if (uuidElem instanceof HTMLInputElement) {
      uuidElem.addEventListener("input", () => {
        this.loadUUIDPreview();
        updatePresetValues(this.element);
      });
    }

    const presetSelect = this.element.querySelector(`#pathPreset`);
    if (presetSelect instanceof HTMLSelectElement) {
      setPresetValues(this.element);
      presetSelect.addEventListener("input", () => { setPresetValues(this.element); });
    }

    setPathSuggestions(this.element, `[data-role="value-path"]`, `[data-role="value-path-suggestions"]`, "value");
    setPathSuggestions(this.element, `[data-role="max-path"]`, `[data-role="max-path-suggestions"]`, "max");

    const valueElem = this.element.querySelector(`[data-role="value-path"]`);
    if (valueElem instanceof HTMLInputElement) {
      valueElem.addEventListener("input", () => { setPathSuggestions(this.element, `[data-role="value-path"]`, `[data-role="value-path-suggestions"]`, "value"); });
    }

    const maxElem = this.element.querySelector(`[data-role="max-path"]`);
    if (maxElem instanceof HTMLInputElement) {
      maxElem.addEventListener("input", () => { setPathSuggestions(this.element, `[data-role="max-path"]`, `[data-role="max-path-suggestions"]`, "max"); });
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
}