import { coerceJSON, coerceMacro } from '../coercion';
import { InvalidMacroError, MacroPermDeniedError } from '../errors';
import { SerializedMacroTrigger, SerializedTrigger } from '../types';
import { TriggerAction } from './TriggerAction';
import { log } from "../logging"

export class MacroTriggerAction extends TriggerAction {
  public static readonly type = "macro";
  public static readonly i18nKey = "MACRO";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getArguments(item: SerializedTrigger): Record<string, any> {
    return {}
  }

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

    const parsedArgs = {
      ...Object.fromEntries(
        Object.entries(args)
          .map(([key, value]) => {
            if (typeof value === "string") {
              const uuid = foundry.utils.parseUuid(value);
              if (uuid.id) return [key, fromUuidSync(value)];

              // Parsing it as JSON will also handle numbers or booleans as strings
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const json = coerceJSON(value);
              if (typeof json !== "undefined") return [key, json];
            }

            return [key, value];
          })
      ),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      args: serialized.arguments.map(arg => arg.value)
    }



    return macro.execute(parsedArgs) as void | Promise<void>;

    // return macro.execute({
    //   ...args,
    //   args: serialized.arguments.map(arg => arg.value)
    // }) as void | Promise<void>;
  }


  public static getDialogLabel(item: SerializedMacroTrigger): string {
    const macro = fromUuidSync(item.macro) as Macro;
    if (!(macro)) throw new InvalidMacroError(item.macro);

    return game.i18n?.format(`STAGEMANAGER.EDITDIALOG.TRIGGERLABELS.MACRO`, { macro: macro.name }) ?? "";
  }

  public static fromForm(form: HTMLFormElement): SerializedMacroTrigger {

    const formData = new FormDataExtended(form);
    const data = foundry.utils.expandObject(formData.object) as Record<string, string>;

    const serialized = {
      ...data,
      id: data.id ?? foundry.utils.randomID(),
      label: data.label ?? "",
      action: "macro",
      arguments: data.arg ? Object.values<{ name: string, value: string }>(data.arg as unknown as Record<string, { name: string, value: string }>) : [],
      macro: data.macro ?? "",
      event: data.event ?? "",
    }
    log("fromForm:", serialized);
    return serialized;
  }

  // public static prepareContext(item: SerializedTrigger): Record<string, any> { throw new NotImplementedError(); }
  public static prepareContext(trigger?: SerializedMacroTrigger): Record<string, any> {
    return {
      macros: getMacros(trigger?.macro)
    }
  }
}



function getMacros(selected?: string): { uuid: string, name: string, pack: string, selected?: boolean }[] {
  const macros: { uuid: string, name: string, pack: string, selected?: boolean }[] = [];
  if (game?.macros)
    macros.push(...game.macros.map((macro: Macro) => ({ uuid: macro.uuid, name: macro.name, pack: "", selected: macro.uuid === selected })));

  if (game?.packs) {
    game.packs.forEach(pack => {
      macros.push(...pack.index.map(item => ({ uuid: item.uuid, name: item.name ?? item.uuid, pack: pack.metadata.label, selected: item.uuid === selected })));
    })
  }

  return macros;
}