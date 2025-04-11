import { StageObjectApplication } from "./StageObjectApplication";
import { Border, SerializedProgressBarStageObject } from "types";
import { ProgressBarStageObject } from "stageobjects";
import { AnyObject, DeepPartial, EmptyObject } from "Foundry-VTT/src/types/utils.mjs";
import { StageManager } from "StageManager";
import { logError } from "logging";
import { drawPanelPreview, easingSelectOptions, fontSelectContext } from "./functions";

export class ProgressBarStageObjectApplication extends StageObjectApplication<ProgressBarStageObject, SerializedProgressBarStageObject> {
  public static readonly PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...ProgressBarStageObjectApplication.FRONT_PARTS,
    progressBar: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.hbs`
    },
    settings: {
      template: `modules/${__MODULE_ID__}/templates/editObject/progressBar.settings.hbs`
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
    ...ProgressBarStageObjectApplication.BACK_PARTS
  }

  protected getTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      progressBar: {
        id: "progressBar",
        cssClass: "",
        active: false,
        label: "STAGEMANAGER.TABS.PROGRESSBAR.TAB",
        icon: "fas fa-bars-progress",
        group: "primary"
      }
    }
  }

  protected parseForm(form: HTMLFormElement): SerializedProgressBarStageObject {
    const data = super.parseForm(form);

    const bounds = data.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    data.bounds = {
      ...data.bounds,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      width: ((data.bounds as any).width ?? this.stageObject.width) / bounds.width,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      height: ((data.bounds as any).height ?? this.stageObject.height) / bounds.height
    }

    // // Parse foreground object
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // if ((data as any).fg) {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   const fg = (data as any).fg as Record<string, unknown>

    //   data.fgBlendMode = parseInt(fg.blendMode as string);
    //   if (isNaN(data.fgBlendMode)) data.fgBlendMode = 0;
    //   data.fgSprite = fg.src as string;
    //   data.fgTint = fg.tint as string;
    //   data.fgBorder = fg.borders as Border;
    //   data.fgPadding = fg.padding as Border;

    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   delete (data as any).fg;
    // }

    // // Parse background object
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // if ((data as any).bg) {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   const bg = (data as any).bg as Record<string, unknown>;

    //   data.bgBlendMode = parseInt(bg.blendMode as string);
    //   if (isNaN(data.bgBlendMode)) data.bgBlendMode = 0;
    //   data.bgSprite = bg.src as string;
    //   data.bgTint = bg.tint as string;
    //   data.bgBorder = bg.borders as Border;

    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   delete (data as any).bg;
    // }

    // // Parse lerp object
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // if ((data as any).lerp) {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   const lerp = (data as any).lerp as Record<string, unknown>;
    //   data.lerpBlendMode = parseInt(lerp.blendMode as string);
    //   if (isNaN(data.lerpBlendMode)) data.lerpBlendMode = 0;
    //   data.lerpSprite = lerp.src as string;
    //   data.lerpTint = lerp.tint as string;
    //   data.lerpBorder = lerp.borders as Border;

    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   delete (data as any).lerp;

    // }

    if (typeof data.textStyle.dropShadowAlpha === "number") data.textStyle.dropShadowAlpha /= 100;
    if (typeof data.textStyle.dropShadowAngle === "number") data.textStyle.dropShadowAngle = Math.toRadians(data.textStyle.dropShadowAngle);

    return data;
  }

  protected getSubTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      settings: {
        label: "STAGEMANAGER.TABS.PROGRESSBAR.SETTINGS",
        active: true,
        cssClass: "active",
        group: "progressBar",
        icon: "fas fa-cubes",
        id: "settings"
      },
      font: {
        label: "STAGEMANAGER.TABS.FONT",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "fas fa-font",
        id: "font"
      },
      bg: {
        label: "STAGEMANAGER.TABS.PROGRESSBAR.BG",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "sm-icon select-background fas fa-fw",
        id: "bg"
      },
      fg: {
        label: "STAGEMANAGER.TABS.PROGRESSBAR.FG",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "sm-icon select-foreground fas fa-fw",
        id: "fg"
      },
      lerp: {
        label: "STAGEMANAGER.TABS.PROGRESSBAR.LERP",
        active: false,
        cssClass: "",
        group: "progressBar",
        icon: "sm-icon select-primary fas fa-fw",
        id: "lerp"
      }
    }
  }

  changeTab(tab: string, group: string, options?: foundry.applications.api.ApplicationV2.ChangeTabOptions): void {
    if (group === "primary") {
      const content = this.hasFrame ? this.element.querySelector(`.window-content`) : this.element;
      if (!content) return;

      if (tab === "progressBar") {
        const sections = content.querySelectorAll(`.tab[data-group="progressBar"]`);
        for (const section of sections) {
          if (section instanceof HTMLElement)
            section.classList.toggle('active', section.dataset.tab === this.tabGroups.progressBar);
        }
      } else {
        const sections = content.querySelectorAll(`.tab[data-group="progressBar"]`);
        for (const section of sections)
          section.classList.toggle('active', false);
      }
    }
    super.changeTab(tab, group, options);
  }

  protected async drawPreview(selector: string, src: string, borders: Border, showGuideSelector: string, overrideWidth?: number, overrideHeight?: number) {
    const canvasObj = this.element.querySelector(`canvas${selector}`);
    if (canvasObj instanceof HTMLCanvasElement) {
      const showGuides: HTMLInputElement | null = this.element.querySelector(showGuideSelector);
      await drawPanelPreview(canvasObj, src, borders, showGuides?.checked ?? true, overrideWidth, overrideHeight);
    }
  }

  protected _onRender(context: Record<string, undefined>, options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | "auto" | undefined; height?: number | "auto" | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): void {
    try {
      super._onRender(context, options);
      this.tabGroups.primary = "basics";
      this.tabGroups.progressBar = "settings";
      void this.drawPreviews(true);
    } catch (err) {

      logError(err as Error);
    }
  }

  private _lastFgBorder = { left: 0, right: 0, top: 0, bottom: 0 };
  private _lastBgBorder = { left: 0, right: 0, top: 0, bottom: 0 };
  private _lastLerpBorder = { left: 0, right: 0, top: 0, bottom: 0 };

  private _lastFgSource = "";
  private _lastBgSource = "";
  private _lastLerpSource = "";

  private _lastFgGuides = true;
  private _lastBgGuides = true;
  private _lastLerpGuides = true;

  protected isElementChecked(selector: string): boolean {
    const elem = this.element.querySelector(selector);
    return (elem instanceof HTMLInputElement && elem.checked);
  }

  protected async drawPreviews(override?: boolean) {
    const fgGuides = this.isElementChecked(`[id="fg.showBorderGuides"]`);
    const bgGuides = this.isElementChecked(`[id="bg.showBorderGuides"]`);
    const lerpGuides = this.isElementChecked(`[id="lerp.showBorderGuides"]`);

    const obj = this.stageObject.serialize();

    const promises: Promise<void>[] = [];

    if (override || !foundry.utils.objectsEqual(obj.fgBorder, this._lastFgBorder) || this._lastFgSource !== obj.fgSprite || this._lastFgGuides !== fgGuides)
      promises.push(this.drawPreview("#FgPanelPreview", obj.fgSprite, obj.fgBorder, `[id="fg.showBorderGuides"]`, typeof this.position.width === "number" ? this.position.width : 0));
    if (override || !foundry.utils.objectsEqual(obj.bgBorder, this._lastBgBorder) || this._lastBgSource !== obj.bgSprite || this._lastBgGuides !== bgGuides)
      promises.push(this.drawPreview("#BgPanelPreview", obj.bgSprite, obj.bgBorder, `[id="bg.showBorderGuides"]`, typeof this.position.width === "number" ? this.position.width : 0));
    if (override || !foundry.utils.objectsEqual(obj.lerpBorder, this._lastLerpBorder) || this._lastLerpSource !== obj.lerpSprite || this._lastLerpGuides !== lerpGuides)
      promises.push(this.drawPreview("#LerpPanelPreview", obj.lerpSprite, obj.lerpBorder, `[id="lerp.showBorderGuides"]`, typeof this.position.width === "number" ? this.position.width : 0));

    this._lastFgBorder = { ...obj.fgBorder };
    this._lastBgBorder = { ...obj.bgBorder };
    this._lastLerpBorder = { ...obj.lerpBorder };

    this._lastFgSource = obj.fgSprite;
    this._lastBgSource = obj.bgSprite;
    this._lastLerpSource = obj.lerpSprite;

    this._lastFgGuides = fgGuides;
    this._lastBgGuides = bgGuides;
    this._lastLerpGuides = lerpGuides;

    if (promises.length) await Promise.all(promises);
  }

  _onChangeForm(): void {
    try {
      super._onChangeForm();
      void this.drawPreviews();

    } catch (err) {
      logError(err as Error);
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

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>
    const bounds = this.stageObject.actualBounds;

    const serialized = context.stageObject as SerializedProgressBarStageObject;
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

    context.textModeSelect = {
      "none": "STAGEMANAGER.EDITDIALOG.TEXTMODE.NONE",
      "values": "STAGEMANAGER.EDITDIALOG.TEXTMODE.VALUES",
      "percentage": "STAGEMANAGER.EDITDIALOG.TEXTMODE.PERCENTAGE"
    };

    context.textAlignmentSelect = {
      "left": "STAGEMANAGER.EDITDIALOG.TEXTALIGN.LEFT",
      "center": "STAGEMANAGER.EDITDIALOG.TEXTALIGN.CENTER",
      "right": "STAGEMANAGER.EDITDIALOG.TEXTALIGN.RIGHT"
    };

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


    return context as EmptyObject;
  }
}