import { ImageStageObject } from './ImageStageObject';
import { InvalidImageError } from '../../errors/InvalidImageError';
import { CustomHooks } from '../constants';
export class ActorStageObject extends ImageStageObject {
  #actor: Actor;

  constructor(actor: Actor) {
    if (!actor.img) throw new InvalidImageError();
    super(actor.img?.toString());
    this.#actor = actor;
  }
}
