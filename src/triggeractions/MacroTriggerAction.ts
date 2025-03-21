import { coerceJSON, coerceMacro } from '../coercion';
import { InvalidMacroError, MacroPermDeniedError } from '../errors';
import { SerializedMacroTrigger, SerializedTrigger, TriggerEventSignatures } from '../types';
import { TriggerAction } from './TriggerAction';

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

  public static async execute(serialized: SerializedMacroTrigger, args: Record<string, any>): Promise<void> {
    const macro = coerceMacro(serialized.macro);
    if (!(macro instanceof Macro)) throw new InvalidMacroError(serialized.macro);
    if (!macro.canExecute) throw new MacroPermDeniedError(serialized.macro);

    // const parsedArgs: Record<string, unknown> = {};

    const parsedArgs = Object.fromEntries(Object.entries({
      ...args,
      ...Object.fromEntries(serialized.arguments.map(item => [item.name, item.value]))
    }))


    for (const key in parsedArgs) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = parsedArgs[key];
      if (typeof value === "string") {
        const uuid = foundry.utils.parseUuid(value);
        if (uuid.id) {
          parsedArgs[key] = await fromUuid(value);
          continue;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const json = coerceJSON(value);
          if (typeof json !== "undefined") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parsedArgs[key] = json;
            continue;
          }
        }
      }
    }
    return macro.execute(parsedArgs) as void | Promise<void>;
  }


  public static getDialogLabel(item: SerializedMacroTrigger): string {
    const macro = fromUuidSync(item.macro) as Macro;
    if (!(macro)) throw new InvalidMacroError(item.macro);
    return game.i18n?.format(`STAGEMANAGER.EDITDIALOG.TRIGGERLABELS.MACRO`, { macro: macro.name }) ?? "";
  }

  public static fromFormData(data: Record<string, unknown>): SerializedMacroTrigger {
    return {
      id: data.id as string ?? foundry.utils.randomID(),
      label: data.label as string ?? "",
      version: data.version as string ?? "1.0.0",
      action: "macro",
      macro: data.macro as string ?? "",
      event: data.event as TriggerEventSignatures ?? "",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      arguments: data.arg ? Object.values(data.arg) : [],
      ...(data.actor ? { actor: data.actor as string } : {})
    };
  }


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