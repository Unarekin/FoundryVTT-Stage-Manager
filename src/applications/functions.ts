// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addEventListeners(parent: HTMLElement) {
  // empty
}

export function fontSelectContext(): Record<string, string> {
  return Object.fromEntries(
    FontConfig.getAvailableFonts()
      .sort((a, b) => a.localeCompare(b))
      .map(font => [font, font])
  );
}

export function textAlignmentContext(): Record<string, string> {
  return {
    left: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.LEFT",
    right: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.RIGHT",
    center: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.CENTER",
    justify: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.JUSTIFY"
  }
}

export function whiteSpaceContext(): Record<string, string> {
  return {
    normal: "STAGEMANAGER.EDITDIALOG.WHITESPACE.NORMAL",
    pre: "STAGEMANAGER.EDITDIALOG.WHITESPACE.PRE",
    "pre-line": "STAGEMANAGER.EDITDIALOG.WHITESPACE.PRELINE"
  }
}