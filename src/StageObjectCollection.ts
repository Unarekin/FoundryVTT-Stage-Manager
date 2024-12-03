import { StageObject } from './stageobjects';


export class StageObjects extends Collection<StageObject> {
  public delete(key: string): boolean {
    const obj = this.get(key);
    const retVal = super.delete(key);
    if (obj && !obj.destroyed) obj.destroy();
    return retVal;
  }
}