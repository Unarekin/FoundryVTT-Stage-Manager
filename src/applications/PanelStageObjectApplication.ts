import { PanelStageObject } from "stageobjects";
import { SerializedPanelStageObject } from "types";
import { StageObjectApplication } from "./StageObjectApplication";
import { EmptyObject } from "Foundry-VTT/src/types/utils.mjs";
import { drawPanelPreview } from "./functions";
import { logError } from "logging";
import { StageManager } from "StageManager";

export class PanelStageObjectApplication extends StageObjectApplication<PanelStageObject, SerializedPanelStageObject> {

  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...PanelStageObjectApplication.FRONT_PARTS,
    panel: {
      template: `modules/${__MODULE_ID__}/templates/editObject/panel.hbs`
    },
    ...PanelStageObjectApplication.BACK_PARTS
  }

  protected getTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      panel: {
        id: "panel",
        active: false,
        cssClass: "",
        group: "primary",
        icon: "fas fa-window-maximize",
        label: "STAGEMANAGER.TABS.PANEL"
      }
    }
  }

  protected parseForm(form: HTMLFormElement): SerializedPanelStageObject {
    const data = super.parseForm(form);
    const bounds = data.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    data.bounds = {
      ...data.bounds,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      width: (data.bounds as any).width / bounds.width,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      height: (data.bounds as any).height / bounds.height
    }

    if (typeof data.blendMode === "string") {
      data.blendMode = parseInt(data.blendMode);
      if (isNaN(data.blendMode)) data.blendMode = 0;
    }

    return data;
  }

  _onChangeForm(): void {
    try {
      super._onChangeForm();
      const previewCanvas = this.element.querySelector(`#PanelPreview`);
      if (previewCanvas instanceof HTMLCanvasElement)
        drawPanelPreview(previewCanvas, this.stageObject.src, this.stageObject.borders);
    } catch (err) {
      logError(err as Error);
    }
  }

  protected _onRender(context: Record<string, undefined>, options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | "auto" | undefined; height?: number | "auto" | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): void {
    try {
      super._onRender(context, options);
      const previewCanvas = this.element.querySelector(`#PanelPreview`);
      if (previewCanvas instanceof HTMLCanvasElement)
        drawPanelPreview(previewCanvas, this.stageObject.src, this.stageObject.borders);
    } catch (err) {
      logError(err as Error);
    }
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>
    const bounds = this.stageObject.actualBounds;

    const serialized = context.stageObject as SerializedPanelStageObject;
    serialized.bounds = {
      ...serialized.bounds,
      width: serialized.bounds.width * bounds.width,
      height: serialized.bounds.height * bounds.height
    }

    context.blendModeSelect = {
      0: `STAGEMANAGER.BLENDMODES.NORMAL`,
      1: `STAGEMANAGER.BLENDMODES.ADD`,
      2: `STAGEMANAGER.BLENDMODES.MULTIPLY`,
      3: `STAGEMANAGER.BLENDMODES.SCREEN`,
      28: `STAGEMANAGER.BLENDMODES.SUBTRACT`
    };

    return context as EmptyObject
  }
}