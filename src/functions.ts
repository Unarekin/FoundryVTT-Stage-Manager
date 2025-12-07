export async function awaitHook(hook: string): Promise<any[]> {
  return new Promise(resolve => {
    Hooks.once(hook as Hooks.HookName, (...args: unknown[]) => { resolve(args); })
  })
}

export function serializeStyle(style: PIXI.TextStyle): Record<string, unknown> {
  const serialized = JSON.parse(JSON.stringify(style)) as Record<string, unknown>;
  for (const key in style) {
    if (key.startsWith("_")) {
      serialized[key.substring(1)] = serialized[key];
      delete serialized[key];
    }
  }
  return serialized;
}