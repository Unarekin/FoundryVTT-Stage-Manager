import { EmptyObject } from "Foundry-VTT/src/types/utils.mjs";
import { StageObjectApplication } from "./StageObjectApplication";
import { TextStageObject } from "stageobjects";
import { SerializedTextStageObject } from "types";
import { fontSelectContext, textAlignmentContext, whiteSpaceContext } from "./functions";

export class TextStageObjectApplication extends StageObjectApplication<TextStageObject, SerializedTextStageObject> {
  public static readonly PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...TextStageObjectApplication.FRONT_PARTS,
    text: {
      template: `modules/${__MODULE_ID__}/templates/editObject/text.hbs`
    },
    font: {
      template: `modules/${__MODULE_ID__}/templates/editObject/font.hbs`
    },
    ...TextStageObjectApplication.BACK_PARTS
  }

  protected getTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      text: {
        id: "text",
        cssClass: "",
        group: "primary",
        active: false,
        icon: "fas fa-paragraph",
        label: "STAGEMANAGER.TABS.TEXT"
      },
      font: {
        id: "font",
        active: false,
        group: "primary",
        cssClass: "",
        icon: "fas fa-font",
        label: "STAGEMANAGER.TABS.FONT"
      }
    }
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>

    context.fontSelect = fontSelectContext();

    const stageObject = context.stageObject as SerializedTextStageObject;
    const style: Record<string, unknown> = {
      ...PIXI.HTMLTextStyle.defaultStyle,
      ...stageObject.style
    };

    stageObject.style = style;

    context.textAlignmentContext = textAlignmentContext();
    context.whitespaceContext = whiteSpaceContext();

    return context as EmptyObject;
  }
}