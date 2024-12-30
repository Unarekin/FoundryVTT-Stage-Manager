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
      hideBounds: StageObjectApplication.HideVisualBounds
    }
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
    log("Parsed form:", parsed);
    log("Original:", data);
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

    if (this.wasSubmitted) {
      if (this.submittedObject) this.stageObject.deserialize(this.submittedObject);
      this.#resolve(this.submittedObject);
    } else {
      this.stageObject.deserialize(this.originalObject);
      this.#resolve();
    }
    this.stageObject.displayObject.removeFromParent();
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

  constructor(protected stageObject: t, options?: DeepPartial<StageObjectApplicationConfiguration>) {
    super(options ?? {});
    this.tabGroups.primary = "basics";
    this.originalObject = stageObject.serialize() as v;

    const layer = StageManager.layers[options?.layer ?? "primary"];
    log("Layer:", layer);
    if (layer) {
      layer.addChild(stageObject.displayObject);
    }

    this.closed = new Promise<v | undefined>((resolve, reject) => {
      // this.#resolvePromise = resolve;
      // this.#rejectPromise = reject;
      this.#resolve = resolve;
      this.#reject = reject;
    })
  }
}
