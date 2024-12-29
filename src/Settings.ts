export function registerSettings() {
  if (game?.settings) {
    game.settings.register(__MODULE_ID__, "currentObjects", {
      name: "Current StageObjects",
      hint: "Serialized list of StageObjects currently present.",
      config: false,
      scope: "world",
      type: Array,
      default: [],
      requiresReload: false
    });

    game.settings.register(__MODULE_ID__, "objectOwnership", {
      name: "Object Ownership",
      hint: "List of StageObjects and their specified owners.",
      config: false,
      scope: "world",
      type: Object,
      default: {},
      requiresReload: false
    });
  }
}

export function setSetting<t = any>(setting: string, value: t): Promise<t | null> {
  if (!game?.settings) return null;
  return game.settings.set(__MODULE_ID__, setting, value) as t | null;
}

export function getSetting<t = any>(setting: string): t | undefined {
  return game?.settings?.get(__MODULE_ID__, setting) as t | undefined;
}