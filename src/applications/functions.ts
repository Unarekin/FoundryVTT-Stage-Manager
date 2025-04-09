import { UnknownDocumentTypeError } from "errors";

interface SectionSpec {
  pack: string;
  uuid: string;
  name: string;
  selected: boolean;
}

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


export function getDocuments(documentName: string, selected?: string): SectionSpec[] {
  if (!(game instanceof Game)) return [];
  const documents: SectionSpec[] = [];

  const collection = game.collections?.get(documentName);
  if (!collection) throw new UnknownDocumentTypeError(documentName);

  // Add non-compendium documents
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  documents.push(...collection.map(item => ({ uuid: item.uuid, name: item.name, pack: "", selected: item.uuid === selected })));

  // Add compendium documents
  if (game?.packs) {
    game.packs.forEach(pack => {
      if (pack.documentName === documentName) {

        documents.push(...pack.index.map(item => ({ uuid: item.uuid, name: item.name ?? item.uuid, pack: pack.metadata.label, selected: item.uuid === selected })));
      }
    })
  }

  return documents;
}
