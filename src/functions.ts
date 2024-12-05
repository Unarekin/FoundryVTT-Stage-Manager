
export function localize(key: string, subs?: Record<string, string>): string {
  if (game?.i18n) return game.i18n.format(key, subs);
  else return key;
}

const CONTEXT_MENUS: ContextMenu[] = [];

export function registerContextMenu(menu: ContextMenu) {
  CONTEXT_MENUS.push(menu);
  const origClose = menu.onClose;
  menu.onClose = (target) => {
    if (CONTEXT_MENUS.includes(menu)) CONTEXT_MENUS.splice(CONTEXT_MENUS.indexOf(menu), 1);
    if (origClose) origClose(target);
  }
}



export async function closeAllContextMenus(options?: ContextMenu.CloseOptions) {
  const menus = [...CONTEXT_MENUS];
  for (const menu of menus) {
    await menu.close(options);
    if (CONTEXT_MENUS.includes(menu)) CONTEXT_MENUS.splice(CONTEXT_MENUS.indexOf(menu), 1);
  }
}