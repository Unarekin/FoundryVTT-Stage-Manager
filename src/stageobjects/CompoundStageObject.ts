import { StageObject } from './StageObject';


export abstract class CompoundStageObject extends StageObject<PIXI.Container> {
  public static readonly type: string = "compound";
  public readonly type: string = "compound";

  public readonly children: StageObject[] = [];

  protected addChild(child: StageObject) {
    this.children.push(child);
  }

  protected removeChild(child: StageObject) {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
  }

  public destroy(): void {
    const children = [...this.children];
    for (const child of children)
      child.destroy();
  }

  constructor(name?: string) {
    const container = new PIXI.Container();
    container.sortableChildren = true;
    super(container, name)

  }
}