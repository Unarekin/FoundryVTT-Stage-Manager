import { log } from '../logging';
import { SerializedTrigger } from '../types';
import { getTriggerActions, getTriggerActionSelect, getTriggerContext, getTriggerEvents, getTriggerFromForm, setSelectedConfig } from "./functions";

export class EditTriggerDialogV2 {
  public static async prompt(trigger?: SerializedTrigger): Promise<SerializedTrigger | undefined> {

    const context = {
      triggerActionSelect: getTriggerActionSelect(),
      triggerEventSelect: getTriggerEvents(trigger),
      trigger,
      ...getTriggerContext(trigger)
    }

    const triggerActions = getTriggerActions();
    for (const action of triggerActions) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      foundry.utils.mergeObject(context, action.prepareContext(trigger as any));
    }



    const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/edit-trigger-dialog.hbs`, context);


    return new Promise<SerializedTrigger | undefined>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dialog = new foundry.applications.api.DialogV2({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        window: ({ title: game.i18n?.localize("STAGEMANAGER.ADDTRIGGERDIALOG.TITLE") } as any),
        content,
        buttons: [
          {
            label: `<i class="fas fa-times"></i> ${game.i18n?.localize("Cancel")}`,
            action: "cancel",
            callback: () => {
              resolve(undefined);
              return Promise.resolve();
            }
          },
          {
            label: `<i class="fas fa-check"></i> ${game.i18n?.localize("Confirm")}`,
            default: true,
            action: "ok",

            callback: (e, button: HTMLButtonElement, html: HTMLDialogElement) => {
              const form = html.querySelector("form");

              if (form instanceof HTMLFormElement) {
                const data = new FormDataExtended(form);
                log("Data:", data);
                const serialized = getTriggerFromForm(form);
                log("Serialized trigger:", serialized);
                if (!serialized) {
                  resolve(undefined);
                } else {
                  if (!serialized.id) serialized.id = foundry.utils.randomID();
                  resolve(serialized);
                }
                // resolve(serialized);
              } else {
                resolve(undefined);
              }
              return Promise.resolve();
            }
          }
        ]
      }).render(true)
        .then(dialog => {
          addEventListeners(dialog);
          setSelectedConfig(dialog.element);
        })
        ;
    })
  }
}

function addEventListeners(dialog: foundry.applications.api.DialogV2) {
  const selectors = dialog.element.querySelectorAll("select#action, select#event");
  for (const selector of selectors) {
    selector.addEventListener("input", () => { setSelectedConfig(dialog.element); });
  }


  const addArgumentButton = dialog.element.querySelector(`button[data-action="addArgument"]`);
  if (addArgumentButton instanceof HTMLButtonElement) {
    addArgumentButton.addEventListener("click", e => {
      e.preventDefault();

      const count = dialog.element.querySelectorAll(`[data-role="additionalArguments"] [data-role='customArguments'] div`).length;
      const row = document.createElement("div");

      row.className = "form-group-slim flexrow";
      let input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("id", `arg.${count}.name`);
      input.setAttribute("name", `arg.${count}.name`);

      row.appendChild(input);

      input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("id", `arg.${count}.value`)
      input.setAttribute("name", `arg.${count}.value`);
      row.appendChild(input);

      const container = dialog.element.querySelector(`[data-role="customArguments"]`)
      if (container instanceof HTMLElement)
        container.appendChild(row);


    });
  }
}
