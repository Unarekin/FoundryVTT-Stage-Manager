/* eslint-disable @typescript-eslint/no-unused-vars */
import { SerializedTrigger } from "../types";
import { NotImplementedError } from '../errors/NotImplementedError';

export abstract class TriggerAction {
  public static readonly type: string = "";
  public static get category(): string { throw new NotImplementedError(); }
  public static get i18nKey(): string { throw new NotImplementedError(); }
  public static validate(serialized: SerializedTrigger, args: Record<string, any>): boolean { throw new NotImplementedError(); }
  public static execute(serialized: SerializedTrigger, args: Record<string, any>): void | Promise<void> { throw new NotImplementedError(); }
  public static fromForm(form: HTMLFormElement): SerializedTrigger { throw new NotImplementedError(); }
  public static getDialogLabel(item: SerializedTrigger): string { throw new NotImplementedError(); }
}