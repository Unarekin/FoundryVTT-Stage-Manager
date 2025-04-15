import { CUSTOM_HOOKS } from "hooks";

const projectfu = {
  hook() {
    Hooks.on("projectfu.processCheck", (data: Record<string, unknown>, actor: Actor, item: Item) => {
      Hooks.callAll(CUSTOM_HOOKS.ITEM_ROLLED, actor, item, data);
    });
  },
  addlArgs: [
    {
      name: "data",
      label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.DATA"
    }
  ]
}

export default projectfu;