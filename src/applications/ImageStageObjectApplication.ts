import { StageManager } from "StageManager";
import { ImageStageObject } from "../stageobjects";
import { SerializedImageStageObject } from "../types";
import { StageObjectApplication } from "./StageObjectApplication";
import { EmptyObject } from "Foundry-VTT/src/types/utils.mjs";

export class ImageStageObjectApplication extends StageObjectApplication<ImageStageObject, SerializedImageStageObject> {
  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...ImageStageObjectApplication.FRONT_PARTS,
    image: {
      template: `modules/${__MODULE_ID__}/templates/editObject/image.hbs`
    },
    ...ImageStageObjectApplication.BACK_PARTS
  }

  protected parseForm(form: HTMLFormElement): SerializedImageStageObject {
    const data = super.parseForm(form);

    const bounds = data.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    data.bounds = {
      ...data.bounds,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      width: (data.bounds as any).width / bounds.width,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      height: (data.bounds as any).height / bounds.height
    }

    return data;
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>
    const bounds = this.stageObject.actualBounds;

    const serialized = context.stageObject as SerializedImageStageObject;
    serialized.bounds = {
      ...serialized.bounds,
      width: serialized.bounds.width * bounds.width,
      height: serialized.bounds.height * bounds.height
    }

    context.blendModeSelect = {
      0: `STAGEMANAGER.BLENDMODES.NORMAL`,
      1: `STAGEMANAGER.BLENDMODES.ADD`,
      2: `STAGEMANAGER.BLENDMODES.MULTIPLY`,
      3: `STAGEMANAGER.BLENDMODES.SCREEN`
    };

    return context as EmptyObject;
  }

  protected getTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      image: {
        id: "image",
        cssClass: "",
        group: "primary",
        active: false,
        icon: "fas fa-image",
        label: "STAGEMANAGER.TABS.IMAGE"
      }
    }
  }
}
