import { StageManager } from './StageManager';
import { StageObject } from './stageobjects';
import { StageLayer } from './types';


export class StageObjects extends Collection<StageObject> {


  /**
   * Returns a list of {@link StageObject}s in this collection on a given {@link StageLayer}
   * @param {StageLayer} layer - {@link StageLayer} 
   * @returns 
   */
  public inLayer(layer: StageLayer) { return this.filter(obj => obj.layer === layer); }
  /** A list of {@link StageObject}s on the primary {@link StageLayer} */
  public get primary() { return this.inLayer("primary"); }
  /** A list of {@link StageObject}s on the background {@link StageLayer} */
  public get background() { return this.inLayer("background"); }
  /** A list of {@link StageObject}s on the foreground {@link StageLayer} */
  public get foreground() { return this.inLayer("foreground"); }
  /** A list of {@link StageObject}s on the text {@link StageLayer} */
  public get text() { return this.inLayer("text"); }

  public get selected() { return this.contents.filter(item => item.selected); }
  public get highlighted() { return this.contents.filter(item => item.highlighted); }
  public get dragging() { return this.contents.filter(item => item.dragging); }
  public get resizing() { return this.contents.filter(item => item.resizing); }
  public get placing() { return this.contents.filter(item => item.placing); }
  public get locked() { return this.contents.filter(item => item.locked); }

  public within(bounds: PIXI.Rectangle, layer?: StageLayer) { return this.contents.filter(item => bounds.intersects(item.bounds) && (layer ? item.layer === layer : true)); }

  /** All objects at the highest zIndex value of a given {@link StageLayer} */
  public highestObjects(layer: StageLayer) {
    const inLayer = this.inLayer(layer);
    const highest = Math.max.apply(null, inLayer.map(obj => obj.zIndex));
    return inLayer.filter(obj => obj.zIndex === highest);
  }

  /** All objects at the lowest zIndex value of a given {@link StageLayer} */
  public lowestObjects(layer: StageLayer) {
    const inLayer = this.inLayer(layer);
    const lowest = Math.min.apply(null, inLayer.map(obj => obj.zIndex));
    return inLayer.filter(obj => obj.zIndex === lowest);
  }

  public delete(key: string): boolean {
    const obj = this.get(key);
    const retVal = super.delete(key);
    if (retVal) StageManager.removeStageObject(obj);
    return retVal;
  }

  public clear() {
    if (!game.user) return;
    const items = [...this.contents.filter(item => StageManager.canDeleteStageObject(game.user?.id ?? "", item.id))];
    for (const item of items) {
      StageManager.removeStageObject(item);
      super.delete(item.id);
    }
  }

}