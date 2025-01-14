import { coerceMacro } from '../coercion';
import { InvalidMacroError, MacroPermDeniedError } from '../errors';
import { SerializedMacroTrigger } from '../types';
import { TriggerAction } from './TriggerAction';
import { log } from "../logging"

export class MacroTriggerAction extends TriggerAction {
  public static readonly type = "macro";
  public static readonly i18nKey = "MACRO";

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public static get category(): string { return "misc"; }
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


  public static getDialogLabel(item: SerializedMacroTrigger): string {
    const macro = fromUuidSync(item.macro) as Macro;
    if (!(macro instanceof Macro)) throw new InvalidMacroError(item.macro);
    return game.i18n.format(`STAGEMANAGER.EDITDIALOG.TRIGGERLABELS.MACRO`, { name: macro.name })
  }

  public static fromForm(form: HTMLFormElement): SerializedMacroTrigger {

    const formData = new FormDataExtended(form);
    const data = foundry.utils.expandObject(formData.object) as Record<string, string>;
    log("fromForm data:", data);

    const serialized = {
      id: data.id ?? foundry.utils.randomID(),
      label: data.label ?? "",
      type: "macro",
      arguments: data.arg ? Object.values<{ name: string, value: string }>(data.arg as unknown as Record<string, { name: string, value: string }>) : [],
      macro: data.macro ?? ""
    }
    log("fromForm:", serialized);
    return serialized;
  }
}
