import { TOOL_LAYERS } from 'types';
import { StageManager } from '../StageManager';



let lastMoved = 0;
const moveInterval = 10;

let snap = false;
const movementDirections = {
  up: false,
  down: false,
  left: false,
  right: false
}

function handleMovement(): boolean {
  const now = Date.now();
  const delta = now - lastMoved;
  if (delta < 100) return false;

  lastMoved = now;

  let dx = 0;
  let dy = 0;
  if (movementDirections.left) dx -= moveInterval;
  if (movementDirections.right) dx += moveInterval;
  if (movementDirections.up) dy -= moveInterval;
  if (movementDirections.down) dy += moveInterval;

  StageManager.StageObjects.selected.forEach(obj => {
    let newX = obj.x + dx;
    let newY = obj.y + dy;

    if (snap) {
      newX = Math.round(newX / moveInterval) * moveInterval;
      newY = Math.round(newY / moveInterval) * moveInterval;
    }

    if (newX !== obj.x) obj.x = newX;
    if (newY !== obj.y) obj.y = newY;
  });
  return true;
}

function shouldMove(context: KeyboardEventContext): boolean {
  // Check for active tour
  if ((Tour.tourInProgress) && (!context.repeat) && (!context.up)) return false;
  if (!TOOL_LAYERS[game.activeTool ?? ""]) return false;
  if (!StageManager.StageObjects.selected.length) return false;

  return true;
}

export function moveUp(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.up = !context.up;
  return handleMovement();
}

export function moveDown(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.down = !context.up;
  return handleMovement();
}

export function moveLeft(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.left = !context.up;
  return handleMovement();
}

export function moveRight(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.right = !context.up;
  return handleMovement();
}

export function moveUpRight(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.right = !context.up;
  movementDirections.up = !context.up;
  return handleMovement();
}

export function moveUpLeft(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.left = !context.up;
  movementDirections.up = !context.up;
  return handleMovement();
}

export function moveDownRight(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.right = !context.up;
  movementDirections.down = !context.up;
  return handleMovement();
}

export function moveDownLeft(context: KeyboardEventContext): boolean {
  if (!shouldMove(context)) return false;

  snap = context.isShift;
  movementDirections.left = !context.up;
  movementDirections.down = !context.up;
  return handleMovement();
}