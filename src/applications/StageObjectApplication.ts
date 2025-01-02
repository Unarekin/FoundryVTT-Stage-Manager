import type { AnyObject, DeepPartial } from "Foundry-VTT/src/types/utils.d.mts";
import { StageObject } from "../stageobjects";
import { StageObjectApplicationContext, StageObjectApplicationOptions, StageObjectApplicationConfiguration, Tab } from "./types";
import { SerializedStageObject } from "../types";
import { StageManager } from "../StageManager";
import ApplicationV2 from "Foundry-VTT/src/foundry/client-esm/applications/api/application.mjs";
import HandlebarsApplicationMixin from "Foundry-VTT/src/foundry/client-esm/applications/api/handlebars-application.mjs";
import { localize } from "../functions";
import { log } from "../logging";

export abstract class StageObjectApplication<t extends StageObject = StageObject, v extends SerializedStageObject = SerializedStageObject> extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<
  StageObjectApplicationContext,
  StageObjectApplicationConfiguration,
  StageObjectApplicationOptions>
) {

  static DEFAULT_OPTIONS = {
    tag: "form",
    position: {
      width: 400
    },
    window: {
      icon: "fas fa-gear",
      contentClasses: ["stage-manager", "standard-form"]
    },
    form: {
      closeOnSubmit: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      handler: StageObjectApplication.onSubmit,

    },
    actions: {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      showBounds: StageObjectApplication.ShowVisualBounds,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      hideBounds: StageObjectApplication.HideVisualBounds,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      locationPresets: StageObjectApplication.ToggleLocationPresets,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetTopLeft: StageObjectApplication.SetPresetTopLeft,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetTop: StageObjectApplication.SetPresetTop,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetTopRight: StageObjectApplication.SetPresetTopRight,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetLeft: StageObjectApplication.SetPresetLeft,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetCenter: StageObjectApplication.SetPresetCenter,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetRight: StageObjectApplication.SetPresetRight,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetBottomLeft: StageObjectApplication.SetPresetBottomLeft,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetBottom: StageObjectApplication.SetPresetBottom,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      presetBottomRight: StageObjectApplication.SetPresetBottomRight
    }
  }

  protected triggerFormChange() {
    this._onChangeForm();
  }

  protected toLeft(): this {
    // log("To left");
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.x']").val(bounds.left);
    // this.triggerFormChange();
    return this;
  }

  protected toTop(): this {
    // log("To top");
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.y']").val(bounds.top);
    // this.triggerFormChange();
    return this;
  }

  protected toRight(): this {
    // log("To right");
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.x']").val(bounds.right);
    // this.triggerFormChange();
    return this;
  }

  protected toBottom(): this {
    // log("To bottom");
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.y']").val(bounds.bottom);
    // this.triggerFormChange();
    return this;
  }

  protected toCenter(): this {
    // log("To center");
    const elem = $(this.element);
    elem.find("[name='bounds.x']").val(window.innerWidth / 2);
    elem.find("[name='bounds.y']").val(window.innerHeight / 2);
    // this.triggerFormChange();
    return this;
  }


  public static SetPresetTopLeft(this: StageObjectApplication) { this.toTop().toLeft().triggerFormChange(); }
  public static SetPresetLeft(this: StageObjectApplication) { this.toLeft().triggerFormChange(); }
  public static SetPresetTop(this: StageObjectApplication) { this.toTop().triggerFormChange(); }
  public static SetPresetTopRight(this: StageObjectApplication) { this.toTop().toRight().triggerFormChange(); }
  public static SetPresetRight(this: StageObjectApplication) { this.toRight().triggerFormChange(); }
  public static SetPresetCenter(this: StageObjectApplication) { this.toCenter().triggerFormChange(); }
  public static SetPresetBottomLeft(this: StageObjectApplication) { this.toBottom().toLeft().triggerFormChange(); }
  public static SetPresetBottom(this: StageObjectApplication) { this.toBottom().triggerFormChange(); }
  public static SetPresetBottomRight(this: StageObjectApplication) { this.toBottom().toRight().triggerFormChange(); }

  public static ToggleLocationPresets(this: StageObjectApplication) {
    // $(this.element).find("#location-presets").css("display", )
    const section = $(this.element).find("#location-presets");
    const visibility = section.css("display");
    if (visibility === "none") section.slideDown();
    else section.slideUp();
    // section.css("display", visibility === "block" ? "none" : "block");
  }

  protected wasSubmitted = false;
  public readonly closed: Promise<v | undefined>;
  #resolve: (val?: v | PromiseLike<v>) => void = () => { /* empty */ };
  // eslint-disable-next-line no-unused-private-class-members
  #reject: (err: any) => void = () => { /* Empty */ };

  public static ShowVisualBounds(this: StageObjectApplication) {
    StageManager.HideVisualBounds();
    StageManager.ShowVisualBounds();
    $("[data-action='showBounds']").css("display", "none");
    $("[data-action='hideBounds']").css("display", "block");
  }

  public static HideVisualBounds(this: StageObjectApplication) {
    StageManager.HideVisualBounds();
    $("[data-action='showBounds']").css("display", "block");
    $("[data-action='hideBounds']").css("display", "none");
  }

  protected parseFormData(data: Record<string, unknown>): v {
    const parsed = foundry.utils.expandObject(data) as v;
    const bounds = parsed.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;
    parsed.bounds.x /= bounds.width;
    parsed.bounds.y /= bounds.height;
    parsed.bounds.width /= bounds.width;
    parsed.bounds.height /= bounds.height;

    return parsed;
  }

  protected submittedObject: v | undefined = undefined;
  public static onSubmit(this: StageObjectApplication, event: Event, form: HTMLFormElement, formData: FormDataExtended) {
    this.wasSubmitted = true;
    this.submittedObject = this.parseFormData(formData.object);
  }
  protected _onClose(): void {
    StageManager.HideVisualBounds();

    this.stageObject.synchronize = this.wasSynced;

    if (this.wasSubmitted) {
      if (this.submittedObject) this.stageObject.deserialize(this.submittedObject);
      this.#resolve(this.submittedObject);
    } else {
      this.stageObject.deserialize(this.originalObject);
      this.#resolve();
    }
    this.stageObject.displayObject.removeFromParent();
    if (this.ghost) this.ghost.destroy();
  }

  protected abstract getTabs(): Record<string, Tab>;

  private _getTabs(): Record<string, Tab> {
    return {
      basics: {
        id: "basics",
        cssClass: "active",
        group: "primary",
        active: false,
        icon: `fas fa-cubes`,
        label: `STAGEMANAGER.TABS.BASICS`
      },
      ...(this.getTabs()),
      triggers: {
        id: "triggers",
        group: "primary",
        active: false,
        cssClass: "",
        icon: `fas fa-forward`,
        label: "STAGEMANAGER.TABS.TRIGGERS"
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async _preparePartContext(partId: string, context: this extends ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown, options: DeepPartial<HandlebarsApplicationMixin.HandlebarsRenderOptions>): Promise<this extends ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown> {
    const tabs = this._getTabs();
    context.tab = tabs[partId];
    context.buttons = [
      { type: "submit", icon: "fas fa-save", label: "SETTINGS.Save" }
    ]
    return Promise.resolve(context);
  }

  _onChangeForm(): void {

    const form = this.element instanceof HTMLFormElement ? new FormDataExtended(this.element) : new FormDataExtended($(this.element).find("form")[0]);
    const data = this.parseFormData(form.object);
    log("Form change:", data);
    this.stageObject.deserialize(data);
  }

  protected prepareStageObject(): v {
    const bounds = this.originalObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;
    return {
      ...this.originalObject,
      bounds: {
        x: this.originalObject.bounds.x * bounds.width,
        y: this.originalObject.bounds.y * bounds.height,
      }
    }
  }


  protected ghost: PIXI.DisplayObject | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _onRender(context: StageObjectApplicationContext, options: StageObjectApplicationOptions): void {
    // Create ghost
    this.stageObject.synchronize = false;
    if (this.stageObject.layer) StageManager.setStageObjectLayer(this.stageObject, this.stageObject.layer);
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | "auto" | undefined; height?: number | "auto" | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<StageObjectApplicationContext> {
    return {
      ...(await super._prepareContext(options)),
      stageObject: this.prepareStageObject(),
      tabs: this._getTabs()
    };
  }

  get title() {
    return localize("STAGEMANAGER.EDITDIALOG.TITLE", { name: this.stageObject.name ?? this.stageObject.id });
  }

  protected originalObject: v;
  protected wasSynced = false;

  constructor(protected stageObject: t, options?: DeepPartial<StageObjectApplicationConfiguration>) {
    super(options ?? {});
    this.tabGroups.primary = "basics";
    this.originalObject = stageObject.serialize() as v;
    this.wasSynced = stageObject.synchronize;

    const layer = StageManager.layers[options?.layer ?? "primary"];

    this.ghost = this.stageObject.createDragGhost();
    this.ghost.alpha = 0.5;
    this.ghost.x = this.stageObject.x;
    this.ghost.y = this.stageObject.y;

    if (layer) {
      layer.addChild(stageObject.displayObject);
      layer.addChild(this.ghost);
      this.ghost.zIndex = stageObject.displayObject.zIndex - 0.5;
    }


    this.closed = new Promise<v | undefined>((resolve, reject) => {
      // this.#resolvePromise = resolve;
      // this.#rejectPromise = reject;
      this.#resolve = resolve;
      this.#reject = reject;
    })
  }
}
