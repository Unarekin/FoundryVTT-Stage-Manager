export const HOOKS: Record<string, keyof Hooks.HookName> = Object.freeze({
  INITIALIZED: `${__MODULE_ID__}.initialized` as (keyof Hooks.HookName),
  SOCKET_SENT: `${__MODULE_ID__}.socketSent` as (keyof Hooks.HookName),
  SOCKET_INIT: `${__MODULE_ID__}.socketInitialized` as (keyof Hooks.HookName),
  OBJECT_REGISTERED: `${__MODULE_ID__}.stageObjectRegistered` as (keyof Hooks.HookName),
  OBJECT_UNREGISTERED: `${__MODULE_ID__}.stageObjectUnregistered` as (keyof Hooks.HookName)
})


Hooks.on("canvasReady", () => {
  if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (window as any).__PIXI_DEVTOOLS__ = {
      stage: canvas?.stage,
      renderer: canvas?.app?.renderer
    };

  }
})

