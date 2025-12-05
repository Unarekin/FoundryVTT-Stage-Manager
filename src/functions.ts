export async function awaitHook(hook: string): Promise<any[]> {
  return new Promise(resolve => {
    Hooks.once(hook as Hooks.HookName, (...args: unknown[]) => { resolve(args); })
  })
}