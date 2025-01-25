import { StageObject } from './StageObject';


export abstract class CompoundStageObject extends StageObject<PIXI.Container> {
  public static readonly type: string = "compound";
  public readonly type: string = "compound";

  // public serialize(): t {
  //   return super.serialize() as t;
  // }

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // public static deserialize(serialized: SerializedStageObject): CompoundStageObject { throw new NotImplementedError(); }
  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // public deserialize(serialized: t) { throw new NotImplementedError(); }

  // public createDragGhost(): PIXI.Container { throw new NotImplementedError(); }

  constructor(name?: string) {
    const container = new PIXI.Container();
    super(container, name)
  }
}