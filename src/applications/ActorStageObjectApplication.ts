import { AnyObject, DeepPartial } from 'Foundry-VTT/src/types/utils.mjs';
import { StageObjectApplication } from './StageObjectApplication';
import { ActorStageObject } from '../stageobjects';
import { SerializedActorStageObject } from '../types';
import { ActorStageObjectApplicationConfiguration, ActorStageObjectApplicationContext, StageObjectApplicationContext, StageObjectApplicationOptions, Tab } from './types';
import { StageManager } from '../StageManager';
import ApplicationV2 from 'Foundry-VTT/src/foundry/client-esm/applications/api/application.mjs';
import HandlebarsApplicationMixin from 'Foundry-VTT/src/foundry/client-esm/applications/api/handlebars-application.mjs';
import { InvalidActorError } from '../errors';
import { getActorSettings } from '../Settings';
import { logError } from '../logging';
import { getActorContext } from './functions';

export class ActorStageObjectApplication extends StageObjectApplication<ActorStageObject, SerializedActorStageObject> {

  static PARTS = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
    },
    actor: {
      template: `modules/${__MODULE_ID__}/templates/editObject/actor.hbs`
    },
    triggers: {
      template: `modules/${__MODULE_ID__}/templates/editObject/triggers.hbs`
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  }

  protected getTabs(): Record<string, Tab> {
    return {
      actor: {
        id: "actor",
        icon: "sm-icon actor-sheet fas fa-fw",
        label: "STAGEMANAGER.TABS.ACTOR",
        active: false,
        cssClass: "",
        group: "primary"
      }
    }
  }

  protected toLeft(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.x']").val(bounds.left + (this.stageObject.width * this.stageObject.anchor.x))
    return this;
  }

  protected topTop(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.y']").val(bounds.top + (this.stageObject.height * this.stageObject.anchor.y))
    return this;
  }

  protected toRight(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.x']").val(bounds.right - (this.stageObject.width * this.stageObject.anchor.x));
    return this;
  }

  protected toBottom(): this {
    const elem = $(this.element);
    const bounds = elem.find("#restrictToVisualArea").is(":checked") ? StageManager.VisualBounds : StageManager.ScreenBounds;
    elem.find("[name='bounds.y']").val(bounds.bottom - (this.stageObject.height * this.stageObject.anchor.y));
    return this;
  }

  protected prepareStageObject(): SerializedActorStageObject {
    const prep = super.prepareStageObject();
    const bounds = this.originalObject.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;
    return {
      ...prep,
      bounds: {
        ...prep.bounds,
        width: this.originalObject.bounds.width * bounds.width,
        height: this.originalObject.bounds.height * bounds.height
      }
    }
  }

  protected async _preparePartContext(partId: string, context: this extends ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown, options: DeepPartial<HandlebarsApplicationMixin.HandlebarsRenderOptions>): Promise<this extends ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown> {
    const temp = await super._preparePartContext(partId, context, options) as ActorStageObjectApplicationContext;

    temp.actor = this.stageObject.actor.uuid;
    foundry.utils.mergeObject(temp, getActorContext());

    return temp as typeof context;
  }


  _onChangeForm(): void {
    super._onChangeForm();
    const form = this.element instanceof HTMLFormElement ? new FormDataExtended(this.element) : new FormDataExtended($(this.element).find("form")[0]);
    const data = this.parseFormData(form.object);
    if (this.ghost instanceof PIXI.Sprite) {
      if (this.ghost.texture.baseTexture.resource.src !== data.src)
        this.ghost.texture = PIXI.Texture.from(data.src);
    }
  }

  protected _onRender(context: StageObjectApplicationContext, options: StageObjectApplicationOptions): void {
    super._onRender(context, options);

    const elem = $(this.element);
    elem.find("select#actor").on("input", (e) => {
      void fromUuid((e.currentTarget as HTMLSelectElement).value)
        .then((actor: Actor) => {
          const settings = getActorSettings(actor);
          if (!settings) throw new InvalidActorError((e.currentTarget as HTMLSelectElement).value);
          elem.find("#name").val(settings.name);
          elem.find("#src input").val(settings.image);

        }).catch((err: Error) => {
          logError(err);
        });

    })
  }

  constructor(stageObject: ActorStageObject, options?: DeepPartial<ActorStageObjectApplicationConfiguration>) {
    super(stageObject, options);

  }
}