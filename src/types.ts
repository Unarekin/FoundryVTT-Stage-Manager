export type StageLayer = "primary" | "foreground" | "background" | "text" | "ui";


export interface SerializedStageObject {
  type: string;
  id: string;
  owners: string[],
  version: string;
  layer: StageLayer;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  skew: { x: number, y: number };
  rotation: number;
  locked: boolean;
  filters: SerializedFilter[];
  restrictToVisualArea: boolean;
}

export interface SerializedImageStageObject extends SerializedStageObject {
  src: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializedFilter { }