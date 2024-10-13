import { ImageStageObject } from './ImageStageObject';
import { InvalidImageError } from '../../errors/InvalidImageError';
export class ActorStageObject extends ImageStageObject {
  #actor: Actor;

  constructor(actor: Actor) {
    if (!actor.img) throw new InvalidImageError();
    super(actor.img?.toString());
    this.#actor = actor;
  }
}