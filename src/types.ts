export type StageLayer = "primary" | "foreground" | "background" | "text";


export interface SerializedStageObject {
  type: string;
  id: string;
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