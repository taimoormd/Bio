export type BackgroundRemovalMode = 'white' | 'black' | 'none';

export interface VectorizerOptions {
  backgroundMode: BackgroundRemovalMode;
  backgroundTolerance: number; // 0 to 100, default 85
  colorCount: number; // 2 to 16
  filterSpeckle?: number;
  pathPrecision?: number;
}

export interface VectorizeResult {
  svgString: string;
  width: number;
  height: number;
  colorCount: number;
}
