import { NotImplementedError } from '../errors';
import { SerializedTrigger, TriggerEventSignatures } from '../types';

export interface AdditionalArgument {
  name: string;
  label: string;
}

export abstract class TriggerEvent {
  public static readonly type: keyof TriggerEventSignatures = "" as keyof TriggerEventSignatures;
  public static readonly label: string = "";
  public static readonly category: string = "";

  public static readonly additionalArguments: AdditionalArgument[] = [];


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getArguments(action: SerializedTrigger): Record<string, unknown> { throw new NotImplementedError(); }
}
