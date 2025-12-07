import { HOOKS } from "hooks";
import { log } from "logging";

export const SOCKET_MESSAGES = Object.freeze({
  OBJECT_SYNC: "sync"
})

export type SocketHandler = (...args: any[]) => void;

export class SocketManager {
  public readonly identifier = `module.${__MODULE_ID__}`

  #messageHandlers = new Map<string, SocketHandler[]>();


  /**
   * Registers a socket handler
   * @param {string} message - Message name to register
   * @param {SocketHandler} handler - {@link SocketHandler}
   * @returns 
   */
  public register(message: string, handler: SocketHandler) {
    if (!(handler instanceof Function)) return;
    const handlers = this.#messageHandlers.get(message) ?? [];
    handlers.push(handler);
    this.#messageHandlers.set(message, handlers);
  }

  /**
   * Unregisters a socket handler
   * @param {string} message - Message name to unregister
   * @param {SocketHandler} handler - {@link SocketHandler}
   */
  public unregister(message: string, handler: SocketHandler) {
    const handlers = this.#messageHandlers.get(message);
    if (Array.isArray(handlers)) this.#messageHandlers.set(message, handlers.filter(item => item !== handler));
  }

  private sendMessage<t extends any[] = any[]>(message: string, users: string[], args: t) {
    if (!game?.user?.id) return
    if (!game?.socket) return;
    const handlers = this.#messageHandlers.get(message);
    if (!Array.isArray(handlers) || !handlers.length) return;

    const actualUsers = users.filter(id => game?.users?.get(id)?.active);
    if (!actualUsers.length) return;

    const actualMessage = foundry.utils.deepFreeze({
      id: foundry.utils.randomID(),
      timestamp: Date.now(),
      sender: game?.user?.id,
      message,
      users: actualUsers,
      args
    });

    const confirmed = Hooks.call(HOOKS.SOCKET_SENT, message);
    if (!confirmed) return;

    log("Sending socket message:", actualMessage);

    if (actualMessage.users.includes(game.user.id)) {
      for (const handler of handlers)
        handler.apply(undefined, [...actualMessage.args, actualMessage]);
    }
    if (actualMessage.users.some(id => id !== game?.user?.id))
      game.socket.emit(this.identifier, actualMessage);
  }

  /**
   * Executes a function as a given user
   * @param {string} message - Message name
   * @param {string} userId - {@link User} ID
   * @param {...unknown} args - Extra arguments to send
   */
  public executeAsUser<t extends any[] = any[]>(message: string, userId: string, args: t) {
    return this.sendMessage(message, [userId], args)
  }

  /**
 * Executes a function as a given user
 * @param {string} message - Message name
 * @param {string} userId - {@link User} ID
 * @param {...unknown} args - Extra arguments to send
 */
  public executeForUser<t extends any[] = any[]>(message: string, userId: string, ...args: t) { return this.executeAsUser(message, userId, args); }

  /**
   * Executes a function as a set of users
   * @param {string} message - Message name
   * @param {string[]} users - List of user IDs
   * @param {...unknown} args - Extra arguments to send
   * @returns 
   */
  public executeForUsers<t extends any[] = any[]>(message: string, users: string[], ...args: t) {
    return this.sendMessage(message, users, args);
  }

  /**
   * Executes a given message as every currently connected {@link User}
   * @param {string} message - Message name
   * @param {...unknown} args - Extra arguments to send
   * @returns 
   */
  public executeForEveryone<t extends any[] = any[]>(message: string, ...args: t) {
    return this.sendMessage(
      message,
      (game?.users?.contents ?? []).filter(user => user.active).map(user => user.id),
      args
    );
  }

  /**
   * Executes a given function as the current active GM, if any
   * @param {string} message - Message name
   * @param {...unknown} args - Extra arguments to send
   */
  public executeAsGM(message: string, ...args: unknown[]) {
    if (game?.users?.activeGM)
      return this.sendMessage(message, [game.users.activeGM.id!], args);
  }


  constructor() {
    Hooks.callAll(HOOKS.SOCKET_INIT, this);
  }
}