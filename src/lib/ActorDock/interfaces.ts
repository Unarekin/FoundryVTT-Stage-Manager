import { Position, Size } from '../interfaces';
export interface ActorDockState {
  name: string;
  image: string;

  position?: Position,
  size?: Size,

  portrait: Tile,
  textbox: Tile
}