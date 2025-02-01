import type { AnyObject, DeepPartial } from "Foundry-VTT/src/types/utils.d.mts";
import { StageObject } from "../stageobjects";
import { StageObjectApplicationContext, StageObjectApplicationOptions, StageObjectApplicationConfiguration, Tab } from "./types";
import { SerializedEffect, SerializedStageObject, SerializedTrigger } from "../types";
import { StageManager } from "../StageManager";
import ApplicationV2 from "Foundry-VTT/src/foundry/client-esm/applications/api/application.mjs";
import HandlebarsApplicationMixin from "Foundry-VTT/src/foundry/client-esm/applications/api/handlebars-application.mjs";
import { localize } from "../functions";
import { addTriggerItem, editTriggerItem, getLayerContext, getScenesContext, getScopeContext, getTriggerActionType, getUsersContext, removeTriggerItem, selectEffectDialog } from "./functions";
import { InvalidTriggerError } from "../errors";
import { log, logError } from "../logging";
import { defaultEffect, deserializeEffect, getEffectHandler, getEffectTemplate } from "../lib/effects";



export abstract class StageObjectApplication<t extends StageObject = StageObject, v extends SerializedStageObject = SerializedStageObject> extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2<
  StageObjectApplicationContext,
  StageObjectApplicationConfiguration,
  StageObjectApplicationOptions>
) {

  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
    },
    triggers: {
      template: `modules/${__MODULE_ID__}/templates/editObject/triggers.hbs`
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  }

  static DEFAULT_OPTIONS = {
    tag: "form",
    position: {
      width: 550
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
      presetBottomRight: StageObjectApplication.SetPresetBottomRight,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      addTrigger: StageObjectApplication.AddTrigger,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      editTrigger: StageObjectApplication.EditTrigger,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      removeTrigger: StageObjectApplication.RemoveTrigger,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      addEffect: StageObjectApplication.AddEffect,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      selectEffect: StageObjectApplication.SelectEffect,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      deleteEffect: StageObjectApplication.DeleteEffect
    }
  }

  protected triggerFormChange() {
    this._onChangeForm();
  }

  protected selectedEffectId = "";


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async DeleteEffect(this: StageObjectApplication, e: PointerEvent, element: HTMLSelectElement) {

    const idElem = this.element.querySelector(`input[name="effect.id"]`);
    if (!(idElem instanceof HTMLInputElement)) return;
    const id = idElem.value;
    const option = this.element.querySelector(`select#effectsList option[value="${id}"]`);
    if (!(option instanceof HTMLOptionElement)) return;

    const confirm = await foundry.applications.api.DialogV2.confirm({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title: localize(`STAGEMANAGER.EDITDIALOG.DELETEEFFECT.TITLE`, { type: option.dataset.type ?? "" }) } as any),
      content: localize("STAGEMANAGER.EDITDIALOG.DELETEEFFECT.MESSAGE").replaceAll("\n", "<br>")
    });
    if (confirm) {
      option.remove();
      this.selectEffect("");
      this.triggerFormChange();
    }
  }


  public static SelectEffect(this: StageObjectApplication, e: PointerEvent, element: HTMLSelectElement) {
    this.selectEffect(element.value);
  }

  protected selectEffect(id: string) {

    const section = this.element.querySelector(`[data-role="effect-config"]`);
    if (!(section instanceof HTMLElement)) return;

    section.innerHTML = "";
    const option = this.element.querySelector(`select[name="effectsList"] option[value="${id}"]`);

    if (option instanceof HTMLOptionElement) {
      if (typeof option.dataset.serialized !== "string") return;
      const deserialized = JSON.parse(option.dataset.serialized) as SerializedEffect;
      const template = getEffectTemplate(deserialized.type);
      if (!template) return;
      renderTemplate(`modules/${__MODULE_ID__}/templates/effects/${template}`, {
        ...deserialized,
        serialized: option.dataset.serialized
      })
        .then(content => {
          section.innerHTML = content;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          ColorPicker.install();
        })
        .catch((err: Error) => { logError(err); })
        ;
      const deleteButton = this.element.querySelector(`button[data-action="deleteEffect"]`);
      if (deleteButton instanceof HTMLButtonElement) deleteButton.removeAttribute("disabled");

    } else {
      const deleteButton = this.element.querySelector(`button[data-action="deleteEffect"]`);
      if (deleteButton instanceof HTMLButtonElement) deleteButton.removeAttribute("disabled");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async AddEffect(this: StageObjectApplication, e: PointerEvent, element: HTMLElement) {
    const selected = await selectEffectDialog();
    if (!selected) return;

    const handler = getEffectHandler(selected);
    if (!handler) return;

    const effect = defaultEffect(selected);
    if (!effect) return;

    effect.id = foundry.utils.randomID();

    const filter = deserializeEffect(effect);
    if (!(filter instanceof PIXI.Filter)) return;

    if (Array.isArray(this.stageObject.effects)) this.stageObject.effects.push(filter);
    else this.stageObject.effects = [filter];

    const selectList = this.element.querySelector(`select[name="effectsList"]`);
    if (!(selectList instanceof HTMLSelectElement)) return;

    const option = document.createElement("option");
    option.setAttribute("value", effect.id);
    option.dataset.type = effect.type;
    option.dataset.serialized = JSON.stringify(effect);
    option.innerText = localize(`STAGEMANAGER.EDITDIALOG.EFFECTS.${handler.label}`);
    selectList.add(option);
    selectList.value = effect.id;
    this.selectEffect(effect.id);
    this.triggerFormChange();
  }

  public static RemoveTrigger(this: StageObjectApplication, e: PointerEvent, element: HTMLElement) {
    const id = element.dataset.id ?? "";
    if (id)
      void removeTriggerItem(this.element, id);
    else
      throw new InvalidTriggerError(id);
  }

  public static AddTrigger(this: StageObjectApplication) {
    void addTriggerItem(this.element);
  }

  public static EditTrigger(this: StageObjectApplication, e: PointerEvent, element: HTMLElement) {
    const id = element.dataset.id ?? "";
    if (id)
      void editTriggerItem(this.element, id);
    else
      throw new InvalidTriggerError(id);
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
    // try {
    //   console.group("Parsing form data");
    //   console.log("Data:", data);
    const parsed = foundry.utils.expandObject(data) as v;
    // console.log("Initial parsing:", parsed);


    if (parsed.scope === "user") {
      parsed.scopeOwners = data["scopeOwners.users"] as string[] ?? [];
    } else if (parsed.scope === "scene") {
      parsed.scopeOwners = data["scopeOwners.scenes"] as string[] ?? [];
    } else {
      parsed.scopeOwners = [];
    }

    // log("Scope owners:", parsed.scopeOwners);

    const bounds = parsed.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;
    parsed.bounds.x /= bounds.width;
    parsed.bounds.y /= bounds.height;
    parsed.bounds.width /= bounds.width;
    parsed.bounds.height /= bounds.height;

    if (parsed.triggers) {
      if (typeof parsed.triggers === "string") {
        const temp = JSON.parse(parsed.triggers) as SerializedTrigger;
        parsed.triggers = {
          [temp.event]: [temp]
        };
      } else if (Array.isArray(parsed.triggers)) {
        const triggers = [...parsed.triggers] as string[];
        parsed.triggers = {};
        for (const trigger of triggers) {
          const temp = JSON.parse(trigger) as SerializedTrigger;
          if (Array.isArray(parsed.triggers[temp.event])) parsed.triggers[temp.event]?.push(temp);
          else parsed.triggers[temp.event] = [temp];
        }
      }
    } else {
      parsed.triggers = {};
    }

    // Effects
    // Check to see if we're editing an effect
    const effectConfig = this.element.querySelector(`[data-role="effect-config"]`);
    if (effectConfig instanceof HTMLElement) {
      // We *are* editing one
      const typeElem = effectConfig.querySelector(`[name="effect.type"]`)
      const effectType = typeElem instanceof HTMLInputElement ? typeElem.value : "";
      const handler = getEffectHandler(effectType);
      if (handler) {
        const fromForm = handler.fromForm(effectConfig);
        if (fromForm) {
          const option = this.element.querySelector(`option[value="${fromForm.id}"]`);
          if (option instanceof HTMLOptionElement) {
            option.dataset.serialized = JSON.stringify(fromForm);
          }
        }
      }
    }


    const options = Array.from(this.element.querySelectorAll(`select[name="effectsList"] option`).values()) as HTMLElement[];

    parsed.effects = options.map(option => option.dataset.serialized ? JSON.parse(option.dataset.serialized) as SerializedEffect : "").filter(item => !!item);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (parsed as any).effect;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (parsed as any).effectsList;


    return parsed;
    // } finally {
    //   console.groupEnd();
    // }
  }

  protected submittedObject: v | undefined = undefined;
  public static onSubmit(this: StageObjectApplication, event: Event, form: HTMLFormElement, formData: FormDataExtended) {
    this.wasSubmitted = true;
    this.submittedObject = this.parseFormData(formData.object);
  }

  protected onRevert(): SerializedStageObject {
    return this.originalObject;
  }

  protected _onClose(): void {
    StageManager.HideVisualBounds();

    this.stageObject.synchronize = this.wasSynced;

    if (this.wasSubmitted) {
      if (this.submittedObject) this.stageObject.deserialize(this.submittedObject);
      this.#resolve(this.submittedObject);
    } else {
      const reverted = this.onRevert();
      this.stageObject.deserialize(reverted);
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
      effects: {
        id: "effects",
        group: "primary",
        active: false,
        cssClass: "",
        icon: "fas fa-fire",
        label: "STAGEMANAGER.TABS.EFFECTS"
      },
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


  protected getElementValue<t>(parent: HTMLElement, selector: string, attr: string): t | undefined {
    const elem = parent.querySelector(selector);
    if (!(elem instanceof HTMLElement)) return;
    return elem.getAttribute(attr) as t;
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
    log("Changed:", data);

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
    // addEventListeners(this.element);

    this.setScopeOwners();
    const scopeSelect = this.element.querySelector(`select[name="scope"]`);
    if (scopeSelect instanceof HTMLSelectElement)
      scopeSelect.addEventListener("input", () => { this.setScopeOwners(); });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ColorPicker.install();
  }

  protected setScopeOwners() {
    const select = this.element.querySelector(`select[name="scope"]`);
    if (!(select instanceof HTMLSelectElement)) return;

    const scope = select.value;
    const sections = this.element.querySelectorAll(`[data-scope]`) as unknown as HTMLElement[];
    for (const section of sections)
      section.style.display = scope === section.dataset.scope ? "block" : "none";
  }

  protected normalizeBounds(bounds: { x: number, y: number, width: number, height: number }): { x: number, y: number, width: number, height: number } {
    const { width, height } = this.stageObject.actualBounds;

    return {
      x: bounds.x / width,
      y: bounds.y / height,
      width: bounds.width / width,
      height: bounds.height / height
    }
  }

  protected boundsToScreen(bounds: { x: number, y: number, width: number, height: number }): { x: number, y: number, width: number, height: number } {
    const { width, height } = this.stageObject.actualBounds;

    return {
      x: bounds.x * width,
      y: bounds.y * height,
      width: bounds.width * width,
      height: bounds.height * height
    }
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | "auto" | undefined; height?: number | "auto" | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<StageObjectApplicationContext> {
    const serialized = this.prepareStageObject();
    const triggers = Object.values(serialized.triggers).flat();
    const context = {
      ...(await super._prepareContext(options)),
      stageObject: serialized,
      tabs: this._getTabs(),
      layerSelect: getLayerContext(),
      scopeSelect: getScopeContext(),
      usersSelect: getUsersContext(this.stageObject),
      scenesSelect: getScenesContext(this.stageObject),
      effects: serialized.effects.map(effect => {
        const handler = getEffectHandler(effect.type);
        if (!handler) throw new Error();
        return {
          ...effect,
          serialized: JSON.stringify(effect),
          label: `STAGEMANAGER.EDITDIALOG.EFFECTS.${handler.label}`
        }
      }),
      triggers: triggers.map(trigger => {
        const triggerClass = getTriggerActionType(trigger.action);
        if (triggerClass) {
          return {
            trigger,
            serialized: JSON.stringify(trigger),
            actionLabel: triggerClass.getDialogLabel(trigger),
            eventLabel: `STAGEMANAGER.TRIGGERS.EVENTS.${trigger.event.toUpperCase()}`
          }
        }
      })
    };

    return context;
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
    });
  }
}
