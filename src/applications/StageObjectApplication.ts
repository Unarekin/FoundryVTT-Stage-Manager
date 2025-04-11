import { StageObject } from '../stageobjects/StageObject';
import { SerializedStageObject, SerializedTrigger } from '../types';
import { log, logError } from '../logging';
import { AnyObject, DeepPartial, EmptyObject } from 'Foundry-VTT/src/types/utils.mjs';
import { localize } from 'functions';
import { addEventListeners } from "./functions";
import { InvalidMacroError, InvalidTriggerError, LocalizedError } from 'errors';
import { StageManager } from 'StageManager';
import { addTrigger, deleteTrigger, editTrigger, parseTriggerFormData, parseTriggerList, setTriggerOption } from "./triggerFunctions";
import { addEffect, deleteEffect, parseEffectFormData, parseEffectList, selectEffect, setEffectOption } from "./effectFunctions";
import { getEffectHandler } from 'lib/effects';
import { getTriggerActionType } from 'triggeractions';

export abstract class StageObjectApplication<t extends StageObject = StageObject, v extends SerializedStageObject = SerializedStageObject> extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

  public static readonly stageObjectType = "";

  #reject: ((err: Error) => void) | undefined = undefined;
  #resolve: ((val?: v) => void) | undefined = undefined;

  private _original: v | undefined = undefined;
  public get original() { return this._original; }

  private _closed: Promise<v | undefined> | undefined = undefined;
  public get closed() { return this._closed; }

  private _ghost: PIXI.DisplayObject | undefined = undefined;
  public get ghost() { return this._ghost; }

  public static readonly FRONT_PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
    }
  }

  public static readonly BACK_PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    effects: {
      template: `modules/${__MODULE_ID__}/templates/editObject/effects.hbs`
    },
    triggers: {
      template: `modules/${__MODULE_ID__}/templates/editObject/triggers.hbs`
    },
    permissions: {
      template: `modules/${__MODULE_ID__}/templates/editObject/permissions.hbs`
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  }

  public static readonly PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...StageObjectApplication.FRONT_PARTS,
    ...StageObjectApplication.BACK_PARTS
  };

  public static readonly DEFAULT_OPTIONS: Record<string, unknown> = {
    window: {
      icon: "fas fa-gear",
      contentClasses: ["stage-manager", "standard-form"]
    },
    position: {
      width: 600
    },
    tag: "form",
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      handler: StageObjectApplication.onSubmit
    },
    actions: {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      showBounds: StageObjectApplication.ShowBounds,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      hideBounds: StageObjectApplication.HideBounds,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      locationPresets: StageObjectApplication.ToggleLocationPresets,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      addTrigger: StageObjectApplication.AddTrigger,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      addTriggerArgument: StageObjectApplication.AddTriggerArgument,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      removeTriggerArgument: StageObjectApplication.RemoveTriggerArgument,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      selectTrigger: StageObjectApplication.SelectTrigger,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      deleteTrigger: StageObjectApplication.DeleteTrigger,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      addEffect: StageObjectApplication.AddEffect,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      selectEffect: StageObjectApplication.SelectEffect,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      deleteEffect: StageObjectApplication.DeleteEffect,

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

  public static async DeleteEffect(this: StageObjectApplication) {
    await deleteEffect(this.element);
    this._onChangeForm();
  }

  public static async SelectEffect(this: StageObjectApplication, e: PointerEvent, elem: HTMLSelectElement) {
    await selectEffect(this.element, elem.value);
    this._onChangeForm();
  }

  public static async AddEffect(this: StageObjectApplication) {
    await addEffect(this.element);
    this._onChangeForm();
  }

  protected setX(val: number) {
    const elem = this.element.querySelector(`input[name="bounds.x"]`);
    if (elem instanceof HTMLInputElement) elem.value = val.toString();
  }

  protected setY(val: number) {
    const elem = this.element.querySelector(`input[name="bounds.y"]`);
    if (elem instanceof HTMLInputElement) elem.value = val.toString();
  }

  protected toTop() {
    this.stageObject.top = 0;
    this.setY(this.stageObject.y);
  }
  protected toLeft() {
    this.stageObject.left = 0;
    this.setX(this.stageObject.x);
  }

  protected toRight() {
    this.stageObject.right = this.stageObject.actualBounds.right - this.stageObject.actualBounds.left;
    this.setX(this.stageObject.x);
  }
  protected toBottom() {
    this.stageObject.bottom = this.stageObject.actualBounds.bottom - this.stageObject.actualBounds.top;
    this.setY(this.stageObject.y);
  }


  public static SetPresetTopLeft(this: StageObjectApplication) {
    this.toTop();
    this.toLeft();
    this._onChangeForm();
  }

  public static SetPresetTop(this: StageObjectApplication) {
    this.toTop();
    this._onChangeForm();
  }

  public static SetPresetTopRight(this: StageObjectApplication) {
    this.toTop();
    this.toRight();
    this._onChangeForm();
  }

  public static SetPresetLeft(this: StageObjectApplication) {
    this.toLeft();
    this._onChangeForm();
  }

  public static SetPresetRight(this: StageObjectApplication) {
    this.toRight();
    this._onChangeForm();
  }

  public static SetPresetBottomLeft(this: StageObjectApplication) {
    this.toLeft();
    this.toBottom();
    this._onChangeForm();
  }

  public static SetPresetBottom(this: StageObjectApplication) {
    this.toBottom();
    this._onChangeForm();
  }

  public static SetPresetBottomRight(this: StageObjectApplication) {
    this.toBottom();
    this.toRight();
    this._onChangeForm();
  }

  public static SetPresetCenter(this: StageObjectApplication) {
    this.stageObject.center = new PIXI.Point(
      this.stageObject.actualBounds.width / 2,
      this.stageObject.actualBounds.height / 2
    );
    this.setX(this.stageObject.x);
    this.setY(this.stageObject.y);

    this._onChangeForm();
  }

  public static async DeleteTrigger(this: StageObjectApplication) {
    await deleteTrigger(this.element);
    this._onChangeForm();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public static async SelectTrigger(this: StageObjectApplication, e: PointerEvent, elem: HTMLSelectElement) {
    try {
      const option = elem.options[elem.selectedIndex];
      if (!(option instanceof HTMLOptionElement)) return;
      if (!option.dataset.serialized) return;

      void editTrigger(this.element, JSON.parse(option.dataset.serialized) as SerializedTrigger, this.stageObject);
    } catch (err) {
      logError(err as Error);
    }
  }

  public static RemoveTriggerArgument(this: StageObjectApplication, e: PointerEvent, elem: HTMLElement) {
    try {
      const row = elem.closest(`[data-role="custom-argument"]`);
      if (row instanceof HTMLElement) row.remove();
    } catch (err) {
      logError(err as Error);
    }
  }

  public static async AddTriggerArgument(this: StageObjectApplication) {
    try {
      const container = this.element.querySelector(`[data-role="customArguments"]`);
      if (!(container instanceof HTMLElement)) return;

      const count = container.querySelectorAll(`[data-role="custom-argument"]`).length;
      const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/editObject/customArgument.hbs`, { count });
      container.innerHTML += content;
    } catch (err) {
      logError(err as Error);
    }
  }

  public static async AddTrigger(this: StageObjectApplication) {
    try {
      await addTrigger(this.element, this.stageObject);
    } catch (err) {
      logError(err as Error);
    }
  }

  public static ToggleLocationPresets(this: StageObjectApplication) {
    try {
      // Use jquery on this one to animate the slide in/out
      const section = $(this.element).find("#location-presets");
      const visibility = section.css("display");
      if (visibility === "none") section.slideDown();
      else section.slideUp();
    } catch (err) {
      logError(err as Error);
    }
  }

  public static ShowBounds(this: StageObjectApplication) {
    StageManager.ShowVisualBounds();
    const showBounds = this.element.querySelector(`[data-action="showBounds"]`);
    const hideBounds = this.element.querySelector(`[data-action="hideBounds"]`);
    if (showBounds instanceof HTMLElement) showBounds.style.display = "none";
    if (hideBounds instanceof HTMLElement) hideBounds.style.display = "block";
  }

  public static HideBounds(this: StageObjectApplication) {
    StageManager.HideVisualBounds();
    const showBounds = this.element.querySelector(`[data-action="showBounds"]`);
    const hideBounds = this.element.querySelector(`[data-action="hideBounds"]`);
    if (showBounds instanceof HTMLElement) showBounds.style.display = "block";
    if (hideBounds instanceof HTMLElement) hideBounds.style.display = "none";
  }

  public get title() {
    return localize("STAGEMANAGER.EDITDIALOG.TITLE", { name: this.stageObject.name ?? this.stageObject.id });
  }

  protected submitted = false;

  public static onSubmit(this: StageObjectApplication) {
    this.submitted = true;
  }

  protected cleanup() {
    try {
      this.#reject = undefined;
      this.#resolve = undefined;
      this._closed = undefined;
      try {
        if (this.ghost instanceof PIXI.DisplayObject) this.ghost.destroy();
      } catch { /* empty */ }
      this._ghost = undefined;
      this._original = undefined;
      this.stageObject.synchronize = true;
    } catch (err) {
      logError(err as Error);
    }
  }


  protected parseForm(form: HTMLFormElement): v {
    const formData = new FormDataExtended(form, {});
    const data = foundry.utils.expandObject(formData.object) as Record<string, unknown>;


    const bounds = data.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    data.bounds = {
      ...(typeof data.bounds === "object" ? data.bounds : {}),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      x: (data.bounds as any).x / bounds.width,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      y: (data.bounds as any).y / bounds.height
    }

    if (typeof data.alpha === "number") data.alpha /= 100;

    data.triggers = {};

    // Parse triggers
    data.triggers = parseTriggerList(form);

    const triggerForm = parseTriggerFormData(data);
    if (triggerForm) {
      const triggers = data.triggers as Record<string, SerializedTrigger[]>;
      if (Array.isArray(triggers[triggerForm.event])) {
        const index = triggers[triggerForm.event].findIndex(item => item.id === triggerForm.id);
        if (index !== -1) triggers[triggerForm.event][index] = triggerForm;
        else triggers[triggerForm.event].push(triggerForm);
      } else {
        triggers[triggerForm.event] = [triggerForm];
      }

      try {
        setTriggerOption(this.element, triggerForm);
      } catch (err) {
        // Ignore InvalidMacroError, since we could be processing this before one is selected
        if (!(err instanceof InvalidMacroError)) throw err;
      }
    }



    delete data.triggerList;
    delete data.trigger;

    // Parse effects
    const effectsList = parseEffectList(form);
    data.effects = effectsList;

    const effectForm = parseEffectFormData(form);
    if (effectForm) {
      const index = effectsList.findIndex(item => item.id === effectForm.id);
      if (index !== -1) effectsList[index] = effectForm;
      else effectsList.push(effectForm);

      setEffectOption(form, effectForm);
    }



    delete data.effect;
    delete data.effectsList;

    return {
      ...data
    } as unknown as v;

  }

  _onChangeForm(): void {
    if (!(this.element instanceof HTMLFormElement)) throw new LocalizedError("INVALIDFORMELEMENT");
    const data = this.parseForm(this.element);
    log("Form change:", data);
    this.stageObject.deserialize(data);
  }

  protected _onClose(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): void {
    try {
      super._onClose(options);
      if (this.ghost instanceof PIXI.DisplayObject) this.ghost.destroy();


      if (!this.submitted && this.original) {
        log("reverting", this.original);
        this.stageObject.deserialize(this.original);
      }

      if (this.#resolve) this.#resolve();
    } catch (err) {
      logError(err as Error);
      if (this.#reject) this.#reject(err as Error);
    } finally {
      this.cleanup();
    }
  }



  protected getTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {}
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>
    const bounds = this.stageObject.actualBounds;

    const serialized = this.stageObject.serialize();
    context.stageObject = serialized;
    context.originalStageObject = serialized;

    // De-normalize
    serialized.bounds = {
      ...serialized.bounds,
      x: serialized.bounds.x * bounds.width,
      y: serialized.bounds.y * bounds.height
    }

    serialized.alpha *= 100;

    context.layerSelect = {
      primary: "STAGEMANAGER.LAYERS.PRIMARY",
      foreground: "STAGEMANAGER.LAYERS.FOREGROUND",
      background: "STAGEMANAGER.LAYERS.BACKGROUND"
    }

    context.effects = serialized.effects.map(effect => {
      const handler = getEffectHandler(effect.type);
      if (!handler) throw new Error();
      return {
        ...effect,
        serialized: JSON.stringify(effect),
        label: `STAGEMANAGER.EDITDIALOG.EFFECTS.${handler.label}`
      };
    });


    context.triggers = Object.values(serialized.triggers).flat().map(trigger => {
      const triggerClass = getTriggerActionType(trigger.action);
      if (!triggerClass) throw new InvalidTriggerError(trigger.action);
      return {
        trigger,
        serialized: JSON.stringify(trigger),
        actionLabel: triggerClass.getDialogLabel(trigger),
        eventLabel: `STAGEMANAGER.TRIGGERS.EVENTS.${trigger.event.toUpperCase()}`
      };
    });

    // context.effects = [];
    // context.triggers = [];

    context.buttons = [
      { type: "submit", icon: "fas fa-save", label: "SETTINGS.Save" }
    ];


    return context as EmptyObject;
  }

  protected async _preparePartContext(partId: string, ctx: this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown, options: DeepPartial<foundry.applications.api.HandlebarsApplicationMixin.HandlebarsRenderOptions>): Promise<this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown> {
    const context = await super._preparePartContext(partId, ctx, options) as Record<string, unknown>;


    context.tabs = {
      basics: {
        id: "basics",
        cssClass: "active",
        group: "primary",
        active: false,
        icon: "fas fa-cubes",
        label: "STAGEMANAGER.TABS.BASICS"
      },
      ...this.getTabs(),
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
        icon: "fas fa-forward",
        label: "STAGEMANAGER.TABS.TRIGGERS"
      },
      permissions: {
        id: "permissions",
        group: "primary",
        active: false,
        cssClass: "",
        icon: "fas fa-shield",
        label: "STAGEMANAGER.TABS.PERMISSIONS"
      }
    }

    context.tab = (context.tabs as Record<string, foundry.applications.api.ApplicationV2.Tab>)[partId];
    // switch (partId) {

    // }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return context as any;
  }


  protected _onRender(context: Record<string, undefined>, options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): void {
    try {
      super._onRender(context, options);

      this.submitted = false;
      this.stageObject.synchronize = false;

      this._closed = new Promise<v | undefined>((resolve, reject) => {
        this.#resolve = resolve;
        this.#reject = reject;
      });

      options.window = {
        ...(options.window ? options.window : {}),
        title: localize("STAGEMANAGER.EDITDIALOG.TITLE", { name: this.stageObject.name })
      }


      if (options.isFirstRender)
        addEventListeners(this.element);

      // loadTriggers(this.element, this.stageObject);
      this._original = this.stageObject.serialize() as v;

      const ghost = this.stageObject.createDragGhost();
      this._ghost = ghost;
      ghost.alpha = 0.5;
      ghost.zIndex = this.stageObject.zIndex - 1;

      // ghost.alpha = this.stageObject.alpha;
      // this.stageObject.alpha = .5;
      this.stageObject.displayObject.parent.addChild(ghost);

      ghost.interactive = false;
      ghost.interactiveChildren = false;


      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ColorPicker.install();

    } catch (err) {
      logError(err as Error);
      if (this.#reject) this.#reject(err as Error);
      this.cleanup();
    }
  }

  public readonly appId: number;

  constructor(public readonly stageObject: t) {
    super({});

    this.appId = parseInt(this.id.substring(4));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    stageObject.apps[this.appId] = this as any;
  }
}