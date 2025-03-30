import { StageManager } from "StageManager";

function dismiss(context: KeyboardManager.KeyboardEventContext): boolean {
  
  // Check for open context menu
  if (ui.context?.menu.length) return false;
  
  // Check for open tour
  if (Tour.tourInProgress) return false;

  // Check for open UI windows
  if (Object.values(ui.windows).length) return false;

  if (StageManager.StageObjects.selected.length && !context.up) {
    StageManager.DeselectAll();
    return true;
  }

  return false;
}

export default dismiss;