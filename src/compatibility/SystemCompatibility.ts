import { TriggerEventSignatures } from "types";

type TriggerFunc = <k extends keyof TriggerEventSignatures>(event: k, arg: TriggerEventSignatures[k]) => void;

export interface SystemCompatibility {
  SystemID: string;
  MinVersion?: string;
  MaxVersion?: string;
  register: (triggerFunc: TriggerFunc) => void;
}
