import { CUSTOM_HOOKS } from "hooks";
import { SystemCompatibility, TriggerFunc } from './SystemCompatibility';
import EmbeddedCollection from "Foundry-VTT/src/foundry/common/abstract/embedded-collection.mjs";

interface CombatEvent {
  combatant: Combatant;
  combatants: EmbeddedCollection<Combatant, foundry.abstract.Document.Any>;
  round: number;
  type: string;
  actor: Actor;
  Actors: Actor[];
  hasActor: boolean;
  token: TokenDocument
}

export const ProjectFU: SystemCompatibility = {
  SystemID: "projectfu",
  register(triggerFunc: TriggerFunc): void {
    Hooks.on("projectfu.processCheck", (rollData: Record<string, unknown>, actor: Actor, item: Item) => {
      Hooks.callAll(CUSTOM_HOOKS.ITEM_ROLLED, actor, item, rollData);
    });

    /**
     * Combat events:
     *   FU.StartOfCombat   -- PFU calls combatStart hook already
     *   FU.StartOfTurn
     *   FU.EndOfTurn
     *   FU.EndOfRound      -- PFU calls combatRound hook already
     *   FU.EndOfCombat
     */
    // triggerEvent("combatTurnStart", { combat, actor: combatant.actor, combatant, token: combatant.token?.object as Token });
    Hooks.on("projectfu.events.combat", (event: CombatEvent) => {
      switch (event.type) {
        case "FU.StartOfTurn":
          triggerFunc("combatTurnStart", { combat: event.combatant.combat!, combatant: event.combatant, token: event.token.object!, actor: event.actor });
          break;
        case "FU.EndOfTurn":
          triggerFunc("combatTurnEnd", { combat: event.combatant.combat!, combatant: event.combatant, token: event.token.object!, actor: event.actor });
          break;
        case "FU.EndOfCombat":
          triggerFunc("combatEnd", { combat: event.combatants.contents[0]?.combat ?? undefined });
          break;
      }
    });
  }
}
