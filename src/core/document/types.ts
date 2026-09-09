export const MM_TO_PX = 3.7795275591;
export const PX_TO_MM = 1 / MM_TO_PX;

export function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

export function pxToMm(px: number): number {
  return px * PX_TO_MM;
}

export interface MarginsMm {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type PresetKey =
  | 'A0'
  | 'A1'
  | 'Poster_36x48'
  | 'Journal_1Col'
  | 'Journal_2Col'
  | 'Custom';

export interface PresetDefinition {
  name: string;
  description: string;
  widthMm: number;
  heightMm: number;
  marginsMm: MarginsMm;
  columns: number;
  columnGapMm: number;
}

export const PRESET_DEFINITIONS: Record<Exclude<PresetKey, 'Custom'>, PresetDefinition> = {
  A0: {
    name: 'ISO A0 Poster',
    description: '841 × 1189 mm (Standard European/Global Poster)',
    widthMm: 841,
    heightMm: 1189,
    marginsMm: { top: 20, bottom: 20, left: 20, right: 20 },
    columns: 3,
    columnGapMm: 15,
  },
  A1: {
    name: 'ISO A1 Poster',
    description: '594 × 841 mm (Medium Format Poster)',
    widthMm: 594,
    heightMm: 841,
    marginsMm: { top: 15, bottom: 15, left: 15, right: 15 },
    columns: 3,
    columnGapMm: 12,
  },
  Poster_36x48: {
    name: 'US Conference Poster',
    description: '36 × 48 inches (914.4 × 1219.2 mm)',
    widthMm: 914.4,
    heightMm: 1219.2,
    marginsMm: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
    columns: 4,
    columnGapMm: 20,
  },
  Journal_1Col: {
    name: 'Journal Figure (1-Column)',
    description: '85 × 120 mm (Standard Single Column Figure)',
    widthMm: 85,
    heightMm: 120,
    marginsMm: { top: 5, bottom: 5, left: 5, right: 5 },
    columns: 1,
    columnGapMm: 0,
  },
  Journal_2Col: {
    name: 'Journal Figure (2-Column)',
    description: '175 × 150 mm (Standard Double Column Figure)',
    widthMm: 175,
    heightMm: 150,
    marginsMm: { top: 8, bottom: 8, left: 8, right: 8 },
    columns: 2,
    columnGapMm: 8,
  },
};

export interface DocumentConfig {
  preset: PresetKey;
  widthMm: number;
  heightMm: number;
  marginsMm: MarginsMm;
  columns: number;
  columnGapMm: number;
  orientation: 'portrait' | 'landscape';
  backgroundColor?: string;
}

export const ARTBOARD_BACKGROUND_PRESETS = [
  { name: 'Pure White (Default)', color: '#FFFFFF', border: 'border-slate-300' },
  { name: 'Warm Paper / Ivory', color: '#FDFBF7', border: 'border-amber-200' },
  { name: 'Minimal Gray', color: '#F8FAFC', border: 'border-slate-300' },
  { name: 'Nature Sage', color: '#F0FDF4', border: 'border-emerald-200' },
  { name: 'Dark Conference', color: '#0F172A', border: 'border-slate-700' },
  { name: 'Midnight Navy', color: '#0B132B', border: 'border-sky-900' },
];

export interface DocumentPage {
  id: string;
  name: string;
  canvasJson?: any;
}

export function createDefaultDocumentConfig(): DocumentConfig {
  const a0 = PRESET_DEFINITIONS.A0;
  return {
    preset: 'A0',
    widthMm: a0.widthMm,
    heightMm: a0.heightMm,
    marginsMm: { ...a0.marginsMm },
    columns: a0.columns,
    columnGapMm: a0.columnGapMm,
    orientation: 'portrait',
    backgroundColor: '#FFFFFF',
  };
}

export function getEffectiveDimensionsMm(config: DocumentConfig): { widthMm: number; heightMm: number } {
  const { widthMm, heightMm, orientation } = config;
  if (orientation === 'landscape') {
    return {
      widthMm: Math.max(widthMm, heightMm),
      heightMm: Math.min(widthMm, heightMm),
    };
  }
  return {
    widthMm: Math.min(widthMm, heightMm),
    heightMm: Math.max(widthMm, heightMm),
  };
}

export function getEffectiveDimensionsPx(config: DocumentConfig): { widthPx: number; heightPx: number } {
  const { widthMm, heightMm } = getEffectiveDimensionsMm(config);
  return {
    widthPx: mmToPx(widthMm),
    heightPx: mmToPx(heightMm),
  };
}
