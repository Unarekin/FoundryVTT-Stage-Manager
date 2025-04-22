import { CUSTOM_HOOKS } from "hooks"
import { SystemCompatibility, TriggerFunc } from "./SystemCompatibility"

export const dnd5e: SystemCompatibility = {
  SystemID: "dnd5e",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register: function (triggerFunc: TriggerFunc): void {
    Hooks.on("dnd5e.postRollAttack", (roll: any, data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const item = data.subject.item;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const actor = data.subject.actor;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      Hooks.callAll(CUSTOM_HOOKS.ITEM_ROLLED, actor, item, { roll, data });
    });
  }
}
