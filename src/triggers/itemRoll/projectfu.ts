import { CUSTOM_HOOKS } from "hooks";

const projectfu = {
  hook() {
    Hooks.on("projectfu.processCheck", (rollData: Record<string, unknown>, actor: Actor, item: Item) => {
      Hooks.callAll(CUSTOM_HOOKS.ITEM_ROLLED, actor, item, rollData);
    });
  }
}

export default projectfu;