import { TriggerEventSignatures } from "../types";
import { TriggerEvent } from "./TriggerEvent";

export class ClickEvent extends TriggerEvent {
  public static readonly type: keyof TriggerEventSignatures = "click";
  public static readonly label = "CLICK";
  public static readonly category = "mouse";
  public static readonly additionalArguments = [
    { name: "user", label: "USER" },
    { name: "pos", label: "POS" },
    { name: "ctrlKeys", label: "CTRLKEYS" }
  ]
}
