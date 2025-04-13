import { ProgressClockStageObject } from "stageobjects";
import { StageObjectApplication } from "./StageObjectApplication";
import { SerializedProgressClockStageObject } from "types";
import { AnyObject, DeepPartial, EmptyObject } from "Foundry-VTT/src/types/utils.mjs";
import { easingSelectOptions, fontSelectContext } from "./functions";
import { logError, log } from "logging";
import { StageManager } from "StageManager";

export class ProgressClockStageObjectApplication<t extends ProgressClockStageObject, v extends SerializedProgressClockStageObject> extends StageObjectApplication<t, v> {
  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...ProgressClockStageObjectApplication.FRONT_PARTS,
    progressBar: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.hbs`
    },
    settings: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.settings.hbs`
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
    ...ProgressClockStageObjectApplication.BACK_PARTS
  }

  protected getTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      progressBar: {
        id: "progressBar",
        cssClass: "",
        active: false,
        label: "STAGEMANAGER.TABS.PROGRESSCLOCK.TAB",
        icon: "fas fa-bars-progress",
        group: "primary"
      }
    }
  }

  protected getSubTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      settings: {
        label: "STAGEMANAGER.TABS.PROGRESSCLOCK.SETTINGS",
        active: true,
        cssClass: "active",
        group: "progressBar",
        icon: "fas fa-cubes",
        id: "settings"
      },
      font: {
        label: "STAGEMANAGER.TABS.TEXT",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "fas fa-font",
        id: "font"
      },
      bg: {
        label: "STAGEMANAGER.TABS.PROGRESSCLOCK.BG",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "sm-icon select-background fas fa-fw",
        id: "bg"
      },
      fg: {
        label: "STAGEMANAGER.TABS.PROGRESSCLOCK.FG",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "sm-icon select-foreground fas fa-fw",
        id: "fg"
      },
      lerp: {
        label: "STAGEMANAGER.TABS.PROGRESSCLOCK.LERP",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "sm-icon select-primary fas fa-fw",
        id: "lerp"
      }
    }
  }

  protected async _preparePartContext(partId: string, ctx: this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown, options: DeepPartial<foundry.applications.api.HandlebarsApplicationMixin.HandlebarsRenderOptions>): Promise<this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown> {
    const context = await super._preparePartContext(partId, ctx, options) as Record<string, unknown>;

    switch (partId) {
      case "progressBar":
        context.subTabs = this.getSubTabs();
        break;
      default:
        context.formPrefix = "";
        context.stageObject = context.originalStageObject;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return context as any;
  }

  protected _onRender(context: Record<string, undefined>, options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | "auto" | undefined; height?: number | "auto" | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): void {
    try {
      super._onRender(context, options);
      this.tabGroups.primary = "basics";
      this.tabGroups.progressBar = "settings";
      // void this.drawPreviews(true);
    } catch (err) {
      logError(err as Error);
    }
  }

  protected parseForm(form: HTMLFormElement): v {
    const data = super.parseForm(form);

    const bounds = data.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    data.bounds = {
      ...data.bounds,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      width: ((data.bounds as any).width ?? this.stageObject.width) / bounds.width,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      height: ((data.bounds as any).height ?? this.stageObject.height) / bounds.height
    }

    if (data.textStyle) {
      if (typeof data.textStyle.dropShadowAlpha === "number") data.textStyle.dropShadowAlpha /= 100;
      if (typeof data.textStyle.dropShadowAngle === "number") data.textStyle.dropShadowAngle = Math.toRadians(data.textStyle.dropShadowAngle);
    }

    if (typeof data.bgTint === "string") data.bgTint = new PIXI.Color(data.bgTint).toHex();
    if (typeof data.fgTint === "string") data.fgTint = new PIXI.Color(data.fgTint).toHex();
    if (typeof data.lerpTint === "string") data.lerpTint = new PIXI.Color(data.lerpTint).toHex();

    return data;
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>
    const bounds = this.stageObject.actualBounds;

    const serialized = context.stageObject as SerializedProgressClockStageObject;
    serialized.bounds = {
      ...serialized.bounds,
      width: serialized.bounds.width * bounds.width,
      height: serialized.bounds.height * bounds.height
    }


    log("BG Tint:", context.bgTint);

    context.blendModeSelect = {
      0: `STAGEMANAGER.BLENDMODES.NORMAL`,
      1: `STAGEMANAGER.BLENDMODES.ADD`,
      2: `STAGEMANAGER.BLENDMODES.MULTIPLY`,
      3: `STAGEMANAGER.BLENDMODES.SCREEN`,
      28: `STAGEMANAGER.BLENDMODES.SUBTRACT`
    };

    context.textModeSelect = {
      "none": "STAGEMANAGER.EDITDIALOG.TEXTMODE.NONE",
      "values": "STAGEMANAGER.EDITDIALOG.TEXTMODE.VALUES",
      "percentage": "STAGEMANAGER.EDITDIALOG.TEXTMODE.PERCENTAGE"
    };

    context.textHAlignmentSelect = {
      "left": "STAGEMANAGER.EDITDIALOG.TEXTALIGN.LEFT",
      "center": "STAGEMANAGER.EDITDIALOG.TEXTALIGN.CENTER",
      "right": "STAGEMANAGER.EDITDIALOG.TEXTALIGN.RIGHT"
    }

    context.textVAlignmentSelect = {
      top: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.TOP",
      center: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.CENTER",
      bottom: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.BOTTOM"
    }

    context.lerpEasingSelect = easingSelectOptions();

    context.fontSelect = fontSelectContext();

    // Merge default style into textStyle

    const textStyle = {
      ...PIXI.HTMLTextStyle.defaultStyle,
      ...serialized.textStyle
    };
    serialized.textStyle = textStyle;

    textStyle.dropShadowAlpha *= 100;
    textStyle.dropShadowAngle = Math.toDegrees(textStyle.dropShadowAngle);

    log("Context:", context);
    return context as EmptyObject;
  }
}