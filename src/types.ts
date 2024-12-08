export type StageLayer = "primary" | "foreground" | "background" | "text" | "ui";


export interface SerializedStageObject {
  type: string;
  id: string;
  owners: string[],
  version: string;
  layer: StageLayer;
  data: Record<string, unknown>;
  name: string;
}

export interface SerializedTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  skewX: number;
  skewY: number;
  pivotX: number;
  pivotY: number
}

export enum ScreenAnchors {
  None = 0,             // 0
  Left = 1 << 0,        // 1
  Right = 1 << 1,       // 2
  Top = 1 << 2,         // 4
  Bottom = 1 << 3,      // 8

  All = (1 << 4) - 1    // 15
}