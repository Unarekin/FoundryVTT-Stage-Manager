import { ResourceStageObject } from "stageobjects";
import { StageObjectApplication } from "./StageObjectApplication";
import { SerializedResourceStageObject } from "types";
import { StageObjectApplicationContext, StageObjectApplicationOptions, Tab } from "./types";
import { getActors, getActorTrackableResources } from './functions';
import { InvalidActorError } from "errors";
import ApplicationV2 from "Foundry-VTT/src/foundry/client-esm/applications/api/application.mjs";
import HandlebarsApplicationMixin from "Foundry-VTT/src/foundry/client-esm/applications/api/handlebars-application.mjs";
import { AnyObject, DeepPartial } from "Foundry-VTT/src/types/utils.mjs";



export class ResourceStageObjectApplication extends StageObjectApplication<ResourceStageObject, SerializedResourceStageObject> {
  static PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart> = {
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    basics: {
      template: `modules/${__MODULE_ID__}/templates/editObject/basics.hbs`
    },
    resource: {
      template: `modules/${__MODULE_ID__}/templates/editObject/resource.hbs`
    },
    triggers: {
      template: `modules/${__MODULE_ID__}/templates/editObject/triggers.hbs`
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  };

  static DEFAULT_OPTIONS = {
    ...StageObjectApplication.DEFAULT_OPTIONS,
    actions: {
      ...StageObjectApplication.DEFAULT_OPTIONS.actions,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      selectActor: ResourceStageObjectApplication.SelectActor
    }
  }

  private isSelectingActor = false;
  private actorSelectHint = 0;
  private actorSelectHookId = 0;

  protected endTokenSelect() {
    if (!this.isSelectingActor) return;

    this.isSelectingActor = false;
    if (this.actorSelectHookId) {
      Hooks.off("controlToken", this.actorSelectHookId);
      this.actorSelectHookId = 0;
    }

    if (this.actorSelectHint) {
      ui.notifications?.remove(this.actorSelectHint);
      this.actorSelectHint = 0;
    }
  }

  public static SelectActor(this: ResourceStageObjectApplication, e: PointerEvent, button: HTMLButtonElement) {
    if (!button.dataset.target) return;

    if (this.isSelectingActor) {
      this.endTokenSelect();
    } else {
      if (!button.dataset.target) return;
      const target = this.element.querySelector(button.dataset.target);
      if (!(target instanceof HTMLElement)) return;

      this.isSelectingActor = true;
      this.actorSelectHint = ui.notifications?.info("STAGEMANAGER.EDITDIALOG.SELECTTOKENHINT", { console: false, permanent: true, localize: true }) ?? 0;
      this.actorSelectHookId = Hooks.on("controlToken", (token: Token, controlled: boolean) => {
        if (controlled) {
          if (!token.actor) throw new InvalidActorError(token.actor);
          if (!button.dataset.target) return;

          const target = this.element.querySelector(button.dataset.target);
          if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement)
            target.value = token.actor.uuid;

          this.endTokenSelect();
        }
      });
    }
  }

  protected getTabs(): Record<string, Tab> {
    return {
      resource: {
        id: "resource",
        icon: "fas fa-heart-pulse",
        label: "STAGEMANAGER.TABS.RESOURCE",
        active: false,
        cssClass: "",
        group: "primary"
      }
    }
  }

  protected _onRender(context: StageObjectApplicationContext, options: StageObjectApplicationOptions): void {
    super._onRender(context, options);

    void this.setResourcePathList();
    const actorSelect = this.element.querySelector(`#actor`);
    if (actorSelect instanceof HTMLSelectElement)
      actorSelect.addEventListener("change", () => { void this.setResourcePathList(); });
  }

  protected async setResourcePathList() {
    const actorSelect = this.element.querySelector(`#actor`);
    const list = this.element.querySelector("#trackableResources");
    if (!(list instanceof HTMLDataListElement)) return;

    if (actorSelect instanceof HTMLSelectElement) {
      const uuid = actorSelect.value;
      if (!uuid) return;
      const actor = await fromUuid(uuid);
      if (!(actor instanceof Actor)) return;

      const trackable = getActorTrackableResources(actor.type);
      list.innerHTML = "";
      for (const res of trackable) {
        const option = document.createElement("option");
        option.innerText = res;
        list.appendChild(option);
      }
    }
  }

  protected async _preparePartContext(partId: string, context: this extends ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown, options: DeepPartial<HandlebarsApplicationMixin.HandlebarsRenderOptions>): Promise<this extends ApplicationV2.Internal.Instance<any, any, infer RenderContext extends AnyObject> ? RenderContext : unknown> {
    const newContext = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "resource":
        newContext.tabs = {
          basics: {
            id: "basics",
            group: "resource",
            icon: "fas fa-cubes",
            label: "STAGEMANAGER.TABS.BASICS",
            active: true,
            cssClass: ""
          },
          fg: {
            id: "fg",
            group: "resource",
            icon: "fas",
            label: "STAGEMANAGER.TABS.FOREGROUND",
            active: false,
            cssClass: ""
          },
          bg: {
            id: "bg",
            group: "resource",
            icon: "fas",
            label: "STAGEMANAGER.TABS.BACKGROUND",
            active: false,
            cssClass: ""
          },
          font: {
            id: "font",
            group: "resource",
            icon: "fas fa-paragraph",
            label: "STAGEMANAGER.TABS.FONT",
            active: false,
            cssClass: ""
          }
        }
        break;
      default:

    }

    return newContext;
  }

  protected async _prepareContext(options: { force?: boolean | undefined; position?: { top?: number | undefined; left?: number | undefined; width?: number | "auto" | undefined; height?: number | "auto" | undefined; scale?: number | undefined; zIndex?: number | undefined; } | undefined; window?: { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined; } | undefined; parts?: string[] | undefined; isFirstRender?: boolean | undefined; }): Promise<StageObjectApplicationContext> {
    const context = (await super._prepareContext(options)) as Record<string, unknown>;
    context.actor = this.stageObject.actor?.uuid ?? "";

    return {
      ...context,
      // actors: getDocuments("Actor", context.actor as string),
      actors: getActors(context.actor as string),
    } as unknown as StageObjectApplicationContext;
  }
}