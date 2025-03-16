import { coerceMacro } from "coercion";
import { Action } from "./Action";
import { SerializedMacroAction } from "./types";
import { Conversation } from "../Conversation";
import { InvalidMacroError, PermissionDeniedError } from "errors";

export class MacroAction extends Action<SerializedMacroAction> {
  public static readonly type = "macro";
  public readonly type = MacroAction.type;

  public static readonly version = "1.0.0";
  public readonly version = MacroAction.version;

  public static readonly default: SerializedMacroAction = {
    id: "",
    label: "",
    version: MacroAction.version,
    type: MacroAction.type,
    macro: ""
  };

  public readonly default = MacroAction.default;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(conversation: Conversation): boolean {
    const macro = coerceMacro(this.macro);
    if (!(macro instanceof Macro)) throw new InvalidMacroError(this.macro);
    if (!macro.canExecute) throw new PermissionDeniedError();
    return true;
  }

  public async execute(conversation: Conversation) {
    const macro = coerceMacro(this.macro);
    if (!(macro instanceof Macro)) throw new InvalidMacroError(this.macro);
    if (!macro.canExecute) throw new PermissionDeniedError();

    await macro.execute({
      conversation
    });
  }


  constructor(public macro: string) {
    super();
  }
}