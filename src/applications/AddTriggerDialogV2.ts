import { TriggerEventSignatures } from '../types';
import { getMacros, getTriggerActionSelect, getTriggerEvents, getTriggerFromForm, setSelectedConfig } from "./functions";
import { TriggerDialogResult } from './types';


export class AddTriggerDialogV2 {
  public static async prompt(): Promise<TriggerDialogResult | undefined> {
    const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/add-trigger-dialog.hbs`, {
      triggerActionSelect: getTriggerActionSelect(),
      triggerEventSelect: getTriggerEvents(),
      macros: getMacros()
    });


    return new Promise<TriggerDialogResult | undefined>((resolve) => {
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

                const serialized = getTriggerFromForm(form);
                if (!serialized) {
                  resolve(undefined);
                } else {
                  resolve({
                    event: data.object.event as keyof TriggerEventSignatures,
                    trigger: serialized
                  })
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
