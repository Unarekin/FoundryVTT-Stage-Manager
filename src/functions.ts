export function localize(key: string, subs?: Record<string, string>): string {
  if (game?.i18n) return game.i18n.format(key, { subs });
  else return key;
}