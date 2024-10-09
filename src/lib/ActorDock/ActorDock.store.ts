
import { FeatureStore } from "mini-rx-store";
import { ActorDockState } from "./interfaces"

export class ActorDockStore extends FeatureStore<ActorDockState> {
  constructor(name: string, image: string) {
    super("ActorDock", { name, image }, { multi: true });
  }
}