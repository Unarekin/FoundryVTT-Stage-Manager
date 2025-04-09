import { CanvasNotInitializedError, UnknownDocumentTypeError } from "errors";
import { PanelStageObject } from "stageobjects";

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

export function drawPanelPreview(parent: HTMLElement, panel: PanelStageObject) {
  if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();
  const previewCanvas = parent.querySelector(`canvas#PanelPreview`);
  if (!(previewCanvas instanceof HTMLCanvasElement)) throw new CanvasNotInitializedError();

  const { width, height } = panel.displayObject.texture;
  previewCanvas.width = width;
  previewCanvas.height = height;

  const ctx = previewCanvas.getContext("2d");
  if (!ctx) throw new CanvasNotInitializedError();

  const sprite = new PIXI.Sprite(panel.displayObject.texture.clone());
  const rt = PIXI.RenderTexture.create({ width: sprite.width, height: sprite.height });
  canvas.app.renderer.render(sprite, { renderTexture: rt, skipUpdateTransform: true, clear: false });
  const pixels = Uint8ClampedArray.from(canvas.app.renderer.extract.pixels(rt));

  rt.destroy();
  sprite.destroy();

  const imageData = new ImageData(pixels, width, height);
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.putImageData(imageData, 0, 0);

  const { left, right, top, bottom } = panel.borders;

  ctx.beginPath();
  ctx.moveTo(left, 0);
  ctx.lineTo(left, height);

  ctx.moveTo(0, top);
  ctx.lineTo(width, top);

  ctx.moveTo(width - right, 0);
  ctx.lineTo(width - right, height);

  ctx.moveTo(0, height - bottom);
  ctx.lineTo(width, height - bottom);

  ctx.strokeStyle = "red";
  ctx.stroke();
}