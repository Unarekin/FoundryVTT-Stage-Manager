import { InvalidUserError } from "./errors";


export function coerceUser(id: string): User | undefined
export function coerceUser(uuid: string): User | undefined
export function coerceUser(name: string): User | undefined
export function coerceUser(user: User): User | undefined
export function coerceUser(arg: unknown): User | undefined {
  if (arg instanceof User) return arg;

  if (typeof arg === "string") {
    let user: User | undefined = fromUuidSync(arg) as User | undefined;
    if (user instanceof User) return user;

    user = game.users?.get(arg) as User | undefined;
    if (user instanceof User) return user;

    user = game.users?.getName(arg) as User | undefined;
    if (user instanceof User) return user;
  }

  throw new InvalidUserError(arg);
}