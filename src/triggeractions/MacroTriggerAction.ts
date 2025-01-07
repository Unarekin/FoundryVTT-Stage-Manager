import { coerceMacro } from '../coercion';
import { InvalidMacroError, MacroPermDeniedError } from '../errors';
import { SerializedMacroTrigger } from '../types';
import { TriggerAction } from './TriggerAction';

export class MacroTriggerAction extends TriggerAction {
  public static readonly type = "macro";
  public static readonly i18nKey = "MACRO";
  public static validate(serialized: SerializedMacroTrigger): boolean {
    const macro = coerceMacro(serialized.macro);
    if (!(macro instanceof Macro)) return false;
    if (!macro.canExecute) return false;

    return true;
  }

  public static execute(serialized: SerializedMacroTrigger, args: Record<string, any>): void | Promise<void> {
    const macro = coerceMacro(serialized.macro);
    if (!(macro instanceof Macro)) throw new InvalidMacroError(serialized.macro);
    if (!macro.canExecute) throw new MacroPermDeniedError(serialized.macro);
    return macro.execute({
      ...args,
      args: serialized.arguments
    }) as void | Promise<void>;
  }
}
