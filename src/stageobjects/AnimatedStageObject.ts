import { ImageStageObject } from './ImageStageObject';

export abstract class AnimatedStageObject extends ImageStageObject {
  public static type = "";
  public playing = false;
  public loop = false;


  public abstract play(): void;
  public abstract pause(): void;
  public abstract stop(): void;

}