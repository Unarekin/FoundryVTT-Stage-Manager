import { DialogueStageObject, ImageStageObject } from "../stageobjects";
import { StageObjectApplication } from "./StageObjectApplication";
import { Tab, StageObjectApplicationContext, DialogueStageObjectApplicationContext, DialogueStageObjectApplicationOptions } from "./types";
import { getActorContext, getFontContext, styleFontDropdown } from "./functions";
import { AnyObject, DeepPartial } from "Foundry-VTT/src/types/utils.mjs";
import { SerializedDialogueStageObject, SerializedSpeaker } from "../types";
import { logError } from "../logging";
import { CanvasNotInitializedError, LocalizedError, SpeakerNotFoundError } from "../errors";
import { addSpeaker, parseSpeakerFormData, selectSpeaker, setSpeakerOption, shouldAutoPosition } from './speakerFunctions';
import { coerceJSON } from "../coercion";
import { StageManager } from "../StageManager";
import { localize } from "../functions";


export class DialogueStageObjectApplication extends StageObjectApplication<DialogueStageObject, SerializedDialogueStageObject> {
  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
    },

    panel: {
      template: `modules/${__MODULE_ID__}/templates/editObject/panel.hbs`
    },

    font: {
      template: `modules/${__MODULE_ID__}/templates/editObject/font.hbs`
    },
    effects: {
      template: `modules/${__MODULE_ID__}/templates/editObject/effects.hbs`
    },
    speakers: {
      template: `modules/${__MODULE_ID__}/templates/editObject/speakers.hbs`
    },
    triggers: {
      template: `modules/${__MODULE_ID__}/templates/editObject/triggers.hbs`
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  }

  static DEFAULT_OPTIONS = {
    ...StageObjectApplication.DEFAULT_OPTIONS,
    actions: {
      ...StageObjectApplication.DEFAULT_OPTIONS.actions,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      addSpeaker: DialogueStageObjectApplication.AddSpeaker,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      selectSpeaker: DialogueStageObjectApplication.SelectSpeaker,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      deleteSpeaker: DialogueStageObjectApplication.DeleteSpeaker,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerLocationPresets: DialogueStageObjectApplication.ToggleSpeakerLocationPresets,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetTopLeft: DialogueStageObjectApplication.SetSpeakerPresetTopLeft,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetTop: DialogueStageObjectApplication.SetSpeakerPresetTop,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetTopRight: DialogueStageObjectApplication.SetSpeakerPresetTopRight,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetLeft: DialogueStageObjectApplication.SetSpeakerPresetLeft,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetCenter: DialogueStageObjectApplication.SetSpeakerPresetCenter,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetRight: DialogueStageObjectApplication.SetSpeakerPresetRight,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetBottomLeft: DialogueStageObjectApplication.SetSpeakerPresetBottomLeft,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetBottom: DialogueStageObjectApplication.SetSpeakerPresetBottom,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      speakerPresetBottomRight: DialogueStageObjectApplication.SetSpeakerPresetBottomRight,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      autoPositionSpeakers: DialogueStageObjectApplication.AutoPositionSpeakers,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      toggleAutoPosition: DialogueStageObjectApplication.ToggleAutoPosition,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      toggleAbovePanel: DialogueStageObjectApplication.ToggleAbovePanel,
    }
  }

  public static ToggleAbovePanel(this: DialogueStageObjectApplication, e: PointerEvent, elem: HTMLInputElement) {
    if (elem.checked)
      this.stageObject.speakerSlotTop = "-height";
    else
      this.stageObject.speakerSlotTop = "-height + panelHeight";
    this.autoPositionSpeakers();
  }

  public static ToggleAutoPosition(this: DialogueStageObjectApplication, e: PointerEvent, elem: HTMLInputElement) {

    const toggledElements = this.element.querySelectorAll(`input[name="speaker.bounds.y"], input[name="speaker.bounds.x"], [data-role="speaker-position-preset"]`)

    for (const element of toggledElements) {
      if (element instanceof HTMLInputElement) element.disabled = elem.checked;
      else if (element instanceof HTMLElement && elem.checked) element.setAttribute("disabled", "disabled");
      else if (element instanceof HTMLElement) element.removeAttribute("disabled");
    }

    if (elem.checked) {
      this.autoPositionSpeakers();
    }
  }

  public autoPositionSpeakers() {
    this.triggerFormChange();
    this.stageObject.positionSpeakers(false);
    // Update serialized versions of speakers in the form
    for (const speaker of this.stageObject.speakers) {
      setSpeakerOption(this.element, speaker.serialize());
    }

    // Update currently edited speaker, if any
    const editId = this.element.querySelector(`input[name="speaker.id"]`);
    if (editId instanceof HTMLInputElement) {
      const selected = this.stageObject.speakers.find(speaker => speaker.id === editId.value);
      if (selected)
        void selectSpeaker(this, selected.serialize());
    }
    this.triggerFormChange();
  }

  public static AutoPositionSpeakers(this: DialogueStageObjectApplication) {
    this.autoPositionSpeakers();
  }

  public static ToggleSpeakerLocationPresets(this: DialogueStageObjectApplication) {
    const section = this.element.querySelector("#speaker-location-presets");
    if (!(section instanceof HTMLElement)) throw new LocalizedError("NOCONFIGURATIONELEMENT");

    $(section).slideToggle();
  }

  protected setSpeakerPositionForm(id: string): this {
    const speaker = this.stageObject.getSpeaker(id);
    if (!(speaker instanceof ImageStageObject)) throw new SpeakerNotFoundError(id);

    const xElem = this.element.querySelector(`input[name="speaker.bounds.x"]`);
    if (xElem instanceof HTMLInputElement) xElem.value = speaker.x.toString();

    const yElem = this.element.querySelector(`input[name="speaker.bounds.y"]`);
    if (yElem instanceof HTMLInputElement) yElem.value = speaker.y.toString();

    return this;
  }

  protected speakerToBottom(id: string): this {
    const speaker = this.stageObject.getSpeaker(id);
    if (!(speaker instanceof ImageStageObject)) throw new SpeakerNotFoundError(id);
    speaker.y = -speaker.height + this.stageObject.panel.height;
    this.setSpeakerPositionForm(id);
    return this;
  }

  protected speakerToLeft(id: string): this {
    const speaker = this.stageObject.getSpeaker(id);
    if (!(speaker instanceof ImageStageObject)) throw new SpeakerNotFoundError(id);
    speaker.x = 0;
    this.setSpeakerPositionForm(id);
    return this;
  }

  protected speakerToRight(id: string): this {
    const speaker = this.stageObject.getSpeaker(id);
    if (!(speaker instanceof ImageStageObject)) throw new SpeakerNotFoundError(id);
    // speaker.x = window.innerWidth - speaker.width;
    speaker.x = this.stageObject.panel.width - speaker.width;
    this.setSpeakerPositionForm(id);
    return this;
  }

  protected speakerToTop(id: string): this {
    const speaker = this.stageObject.getSpeaker(id);
    if (!(speaker instanceof ImageStageObject)) throw new SpeakerNotFoundError(id);
    speaker.y = -speaker.height;
    this.setSpeakerPositionForm(id);
    return this;
  }

  protected speakerToCenter(id: string): this {
    const speaker = this.stageObject.getSpeaker(id);
    if (!(speaker instanceof ImageStageObject)) throw new SpeakerNotFoundError(id);
    speaker.x = (this.stageObject.panel.width - speaker.width) / 2;
    this.setSpeakerPositionForm(id);
    return this;
  }

  public static SetSpeakerPresetTopLeft(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToTop(button.dataset.id ?? "").speakerToLeft(button.dataset.id ?? ""); }
  public static SetSpeakerPresetTop(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToTop(button.dataset.id ?? ""); }
  public static SetSpeakerPresetTopRight(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToTop(button.dataset.id ?? "").speakerToRight(button.dataset.id ?? ""); }
  public static SetSpeakerPresetLeft(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToLeft(button.dataset.id ?? ""); }
  public static SetSpeakerPresetCenter(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToCenter(button.dataset.id ?? ""); }
  public static SetSpeakerPresetRight(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToRight(button.dataset.id ?? ""); }
  public static SetSpeakerPresetBottomLeft(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToBottom(button.dataset.id ?? "").speakerToLeft(button.dataset.id ?? ""); }
  public static SetSpeakerPresetBottom(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToBottom(button.dataset.id ?? ""); }
  public static SetSpeakerPresetBottomRight(this: DialogueStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) { this.speakerToBottom(button.dataset.id ?? "").speakerToRight(button.dataset.id ?? ""); }

  public static async AddSpeaker(this: DialogueStageObjectApplication) {
    await addSpeaker(this);
  }

  public static async SelectSpeaker(this: DialogueStageObjectApplication) {
    const select = this.element.querySelector(`select[name="speakerList"]`);
    if (!(select instanceof HTMLSelectElement)) throw new LocalizedError("NOCONFIGURATIONELEMENT");

    if (select.selectedOptions.length === 0) return;

    const option = select.selectedOptions[0];
    const deserialized = coerceJSON(option.dataset.serialized ?? "") as SerializedSpeaker | undefined;
    if (deserialized) await selectSpeaker(this, deserialized);
  }

  public static async DeleteSpeaker(this: DialogueStageObjectApplication) {
    const idElem = this.element.querySelector(`input[name="speaker.id"]`);
    if (!(idElem instanceof HTMLInputElement)) throw new LocalizedError("NOCONFIGELEMENT");

    const id = idElem.value;
    const option = this.element.querySelector(`select[name="speakerList"] option[value="${id}"]`);
    if (!(option instanceof HTMLOptionElement)) return;

    const confirm = await foundry.applications.api.DialogV2.confirm({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title: localize(`STAGEMANAGER.EDITDIALOG.DELETEEFFECT.TITLE`, { type: option.dataset.type ?? "" }) } as any),
      content: localize("STAGEMANAGER.EDITDIALOG.DELETEEFFECT.MESSAGE").replaceAll("\n", "<br>")
    });

    if (confirm) {
      option.remove();
      const config = this.element.querySelector(`[data-role="speaker-config"]`);
      if (config instanceof HTMLElement) config.innerHTML = "";
      this.triggerFormChange();
    }
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<StageObjectApplicationContext> {
    const context = await super._prepareContext(options);

    const newContext = {
      ...context,
      ...getFontContext(this.stageObject.serialize()),
      ...getActorContext(),
      abovePanel: this.stageObject.speakerSlotTop === "-height" ? true : false
    }


    return newContext;
  }

  protected prepareStageObject(): SerializedDialogueStageObject {
    const prep = super.prepareStageObject();
    const style = {
      ...JSON.parse(JSON.stringify(PIXI.HTMLTextStyle.defaultStyle)) as Record<string, unknown>,
      ...prep.text.style,
    }


    prep.text.style = style;

    const bounds = this.stageObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;
    // Denormalize bounds
    // Panel
    prep.panel.bounds = {
      x: prep.panel.bounds.x * bounds.width,
      y: prep.panel.bounds.y * bounds.height,
      width: prep.panel.bounds.width * bounds.width,
      height: prep.panel.bounds.height * bounds.height
    }
    return prep;
  }

  protected onRevert(): SerializedDialogueStageObject {
    const reverted = super.onRevert() as SerializedDialogueStageObject;

    // reverted.panel.bounds = this.normalizeBounds(reverted.panel.bounds);
    // reverted.label.bounds = this.normalizeBounds(reverted.label.bounds);
    // reverted.text.bounds = this.normalizeBounds(reverted.text.bounds);

    return reverted;
  }

  protected prepareDragGhost(): PIXI.Container {
    const ghost = super.prepareDragGhost() as PIXI.Container;

    if (Array.isArray(ghost.children)) {
      const text = ghost.children.find(child => child instanceof PIXI.HTMLText && child.name === "text");
      if (text instanceof PIXI.HTMLText && !text.text) text.text = "Sample text.";

      const label = ghost.children.find(child => child instanceof PIXI.HTMLText && child.name === "label");
      if (label instanceof PIXI.HTMLText && !label.text) label.text = "Label";
    }

    return ghost;
  }

  protected drawPreview() {
    try {
      if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
      const previewCanvas = this.element.querySelector("#PanelPreview");
      if (!(previewCanvas instanceof HTMLCanvasElement)) throw new CanvasNotInitializedError();

      const { width, height } = this.stageObject.panel.displayObject.texture;

      previewCanvas.width = width;
      previewCanvas.height = height;

      previewCanvas.style.width = "100%";

      const ctx = previewCanvas.getContext("2d");
      if (!ctx) throw new CanvasNotInitializedError();

      // const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(this.stageObject.displayObject));


      const sprite = new PIXI.Sprite(this.stageObject.panel.displayObject.texture.clone());
      const rt = PIXI.RenderTexture.create({ width: sprite.width, height: sprite.height });
      canvas.app.renderer.render(sprite, { renderTexture: rt, skipUpdateTransform: true, clear: false });

      const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(rt));
      sprite.destroy();

      const imageData = new ImageData(pixels, width, height);
      ctx.putImageData(imageData, 0, 0);

      const { left, right, top, bottom } = this.stageObject.panel.borders;

      ctx.beginPath();

      // Left column
      ctx.moveTo(left, 0);
      ctx.lineTo(left, height);

      // Top row
      ctx.moveTo(0, top);
      ctx.lineTo(width, top);

      // Right column
      ctx.moveTo(width - right, 0);
      ctx.lineTo(width - right, height);

      // Bottom row
      ctx.moveTo(0, height - bottom);
      ctx.lineTo(width, height - bottom);

      ctx.strokeStyle = "red";
      ctx.stroke();

    } catch (err) {
      logError(err as Error);
    }
  }


  _onChangeForm(): void {
    // log("Form changed");
    super._onChangeForm();
    this.drawPreview();
  }

  protected _onRender(context: DialogueStageObjectApplicationContext, options: DialogueStageObjectApplicationOptions): void {
    super._onRender(context, options);
    this.drawPreview();

    const fontSelects = this.element.querySelectorAll(`select[data-font-select]`);
    for (const select of fontSelects) {
      if (select instanceof HTMLSelectElement) styleFontDropdown(select);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ($(this.element).find(`select[name="speakerList"]`) as any).dragOptions({
      onChange: () => {
        this.triggerFormChange();
        if (shouldAutoPosition(this.element))
          this.autoPositionSpeakers();
      }
    })
  }


  protected parseFormData(data: Record<string, unknown>): SerializedDialogueStageObject {
    // console.groupCollapsed("Parsing form data");
    // try {
    // log("Initial data:", JSON.parse(JSON.stringify(data)));
    const parsed = super.parseFormData(data);
    // log("First pass:", JSON.parse(JSON.stringify(parsed)));

    const serialized = this.prepareStageObject();

    const bounds = this.stageObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    // parsed.bounds = { ...parsed.bounds, width: this.stageObject.width, height: this.stageObject.height };
    // parsed.bounds = this.normalizeBounds(parsed.bounds);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (parsed.bounds as any).width;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (parsed.bounds as any).height;

    const text = parsed.text ? { ...serialized.text, ...parsed.text, text: serialized.text.text } : { ...serialized.text };
    parsed.text = text;
    parsed.panel = parsed.panel ? { ...serialized.panel, ...parsed.panel } : { ...serialized.panel };

    parsed.alpha = serialized.alpha;
    parsed.angle = serialized.angle;
    // parsed.bounds = this.normalizeBounds(parsed.bounds);

    parsed.panel.bounds.x = serialized.panel.bounds.x;
    parsed.panel.bounds.y = serialized.panel.bounds.y;
    parsed.panel.bounds.width /= bounds.width;
    parsed.panel.bounds.height /= bounds.height;

    // parsed.panel.bounds = this.normalizeBounds(parsed.panel.bounds);


    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if ((parsed as any).speaker) {
      // There is a speaker being edited
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ((parsed as any).autoPosition) {
        const posX = this.element.querySelector(`input[name="speaker.bounds.x"]`);
        const posY = this.element.querySelector(`input[name="speaker.bounds.y"]`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (posX instanceof HTMLInputElement) (parsed as any).speaker.bounds.x = parseFloat(posX.value);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (posY instanceof HTMLInputElement) (parsed as any).speaker.bounds.y = parseFloat(posY.value);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      const speaker = parseSpeakerFormData(this.stageObject, (parsed as any).speaker);
      setSpeakerOption(this.element, speaker);
    }

    parsed.speakers = [];

    // Parse list of speakers
    const speakerOptions = this.element.querySelectorAll(`select[name="speakerList"] option`);
    for (const option of speakerOptions) {
      if (option instanceof HTMLOptionElement) {
        const deserialized = coerceJSON(option.dataset.serialized ?? "") as SerializedSpeaker | undefined;

        if (deserialized) parsed.speakers.push(deserialized);
      }
    }


    // log("Speakers:", JSON.parse(JSON.stringify(parsed.speakers)));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (parsed as any).speaker;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (parsed as any).speakerList;

    // log("Final:", parsed);
    return parsed;
    // } finally {
    //   console.groupEnd();
    // }
  }

  protected async _preparePartContext(partId: string, context: this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown, options: DeepPartial<foundry.applications.api.HandlebarsApplicationMixin.HandlebarsRenderOptions>): Promise<this extends foundry.applications.api.ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown> {
    const partContext = await super._preparePartContext(partId, context, options) as Record<string, unknown>;

    switch (partId) {
      case "font":
      case "text":
        partContext.formPrefix = "text.";
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        partContext.stageObject = (partContext as any).originalStageObject.text;
        break;
      case "panel":
        partContext.formPrefix = "panel.";
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        partContext.stageObject = (partContext as any).originalStageObject.panel;
        break;
      default:
        partContext.formPrefix = "";
        partContext.stageObject = partContext.originalStageObject;
    }

    return {
      ...context,
      ...partContext
    }
  }

  protected getTabs(): Record<string, Tab> {
    return {
      panel: {
        id: "panel",
        active: false,
        group: "primary",
        icon: "fas fa-window",
        cssClass: "",
        label: "STAGEMANAGER.TABS.PANEL"
      },
      font: {
        id: "font",
        active: false,
        group: "primary",
        icon: "fas fa-paragraph",
        cssClass: "",
        label: "STAGEMANAGER.TABS.FONT"
      },
      speakers: {
        id: "speakers",
        active: false,
        group: "primary",
        icon: "fas fa-user",
        cssClass: "",
        label: "STAGEMANAGER.TABS.SPEAKERS"
      }
    };
  }

}