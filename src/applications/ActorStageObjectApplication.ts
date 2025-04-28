import { EmptyObject } from "Foundry-VTT/src/types/utils.mjs";
import { StageObjectApplication } from "./StageObjectApplication";
import { ActorStageObject } from "stageobjects";
import { SerializedActorStageObject } from 'types';
import { getDocuments } from "./functions";
import { StageManager } from "StageManager";


export class ActorStageObjectApplication extends StageObjectApplication<ActorStageObject, SerializedActorStageObject> {
  public static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    ...ActorStageObjectApplication.FRONT_PARTS,
    actor: {
      template: `modules/${__MODULE_ID__}/templates/editObject/actor.hbs`
    },
    ...ActorStageObjectApplication.BACK_PARTS
  }

  protected parseForm(form: HTMLFormElement): SerializedActorStageObject {
    const data = super.parseForm(form);

    const bounds = data.restrictToVisualArea ? StageManager.VisualBounds : StageManager.ScreenBounds;

    data.bounds = {
      ...data.bounds,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      width: (data.bounds as any).width / bounds.width,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      height: (data.bounds as any).height / bounds.height
    }

    if (typeof data.blendMode === "string") {
      data.blendMode = parseInt(data.blendMode);
      if (isNaN(data.blendMode)) data.blendMode = 0;
    }

    return data;
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | 'auto' | undefined; height?: number | 'auto' | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<EmptyObject> {
    const context = await super._prepareContext(options) as Record<string, unknown>

    context.actors = getDocuments("Actor", this.stageObject.actor.uuid);

    const bounds = this.stageObject.actualBounds;
    const serialized = context.stageObject as SerializedActorStageObject;

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

    return context as EmptyObject;
  }

  protected getTabs(): Record<string, foundry.applications.api.ApplicationV2.Tab> {
    return {
      actor: {
        id: "actor",
        group: "primary",
        active: false,
        cssClass: "",
        icon: "sm-icon actor-sheet fas fa-fw",
        label: "STAGEMANAGER.TABS.ACTOR"
      }
    }
  }
}