import { create } from 'zustand';
import {
  DocumentConfig,
  PresetKey,
  PRESET_DEFINITIONS,
  createDefaultDocumentConfig,
  MarginsMm,
  DocumentPage,
} from '../core/document/types';
import type { ColorSlot } from '../core/canvas/colorSlots';

export type ToolType = 'select' | 'pan' | 'text' | 'rect' | 'circle';

export interface SelectedObjectProps {
  type: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  scientificMeta?: any;
  bioType?: string;
  membraneParams?: any;
  dnaParams?: any;
  arrowParams?: any;

  // Geometry & Positioning
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  flipX: boolean;
  flipY: boolean;
  isLocked: boolean;

  // Typography
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  underline?: boolean;
  linethrough?: boolean;
  textAlign?: string;
  textBackgroundColor?: string;
  lineHeight?: number;
  charSpacing?: number;

  // Vector / Shape styling
  rx?: number;
  ry?: number;
  strokeDashArray?: number[] | null;
  strokeLineJoin?: string;
  strokeLineCap?: string;
  hasShadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  extractedColors?: string[];
  colorSlots?: ColorSlot[];

  // Image Filters
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  grayscale?: boolean;
  invert?: boolean;
}

export type ColorPanelTarget = 'fill' | 'stroke' | 'textColor' | 'textHighlight' | 'background' | null;

export interface EditorState {
  documentConfig: DocumentConfig;
  activeTool: ToolType;
  zoomPercent: number;
  showMargins: boolean;
  showColumns: boolean;
  hasSelectedObject: boolean;
  selectedObjectCount: number;
  isShapesDrawerOpen: boolean;
  isAssetDrawerOpen: boolean;
  isUploadsDrawerOpen: boolean;
  isVectorizerOpen: boolean;
  vectorizerInputImage: { dataUrl: string; name?: string } | null;
  selectedObjectProps: SelectedObjectProps | null;
  pages: DocumentPage[];
  activePageIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isPropertiesPanelOpen: boolean;
  isColorPanelOpen: boolean;
  colorPanelTarget: ColorPanelTarget;
  colorPanelInitialColor: string | null;
  documentColors: string[];

  // Actions
  setPreset: (preset: PresetKey) => void;
  setDimensions: (widthMm: number, heightMm: number) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  setMargins: (margins: MarginsMm) => void;
  setColumns: (columns: number, gapMm: number) => void;
  setArtboardBackgroundColor: (color: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setZoomPercent: (zoom: number) => void;
  toggleMargins: () => void;
  toggleColumns: () => void;
  setSelectedObjects: (count: number) => void;
  toggleShapesDrawer: () => void;
  setShapesDrawerOpen: (open: boolean) => void;
  toggleAssetDrawer: () => void;
  setAssetDrawerOpen: (open: boolean) => void;
  toggleUploadsDrawer: () => void;
  setUploadsDrawerOpen: (open: boolean) => void;
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  openColorPanel: (target: ColorPanelTarget, initialColor?: string | null) => void;
  closeColorPanel: () => void;
  setDocumentColors: (colors: string[]) => void;
  openVectorizer: (imageSource?: { dataUrl: string; name?: string }) => void;
  closeVectorizer: () => void;
  setSelectedObjectProps: (props: SelectedObjectProps | null) => void;
  setUndoRedoState: (canUndo: boolean, canRedo: boolean) => void;
  addPage: () => void;
  removePage: (index: number) => void;
  setActivePageIndex: (index: number) => void;
  duplicatePage: (index: number) => void;
  updatePageCanvas: (index: number, json: any) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  documentConfig: createDefaultDocumentConfig(),
  activeTool: 'select',
  zoomPercent: 100,
  showMargins: true,
  showColumns: true,
  hasSelectedObject: false,
  selectedObjectCount: 0,
  isShapesDrawerOpen: false,
  isAssetDrawerOpen: false,
  isUploadsDrawerOpen: false,
  isVectorizerOpen: false,
  isPropertiesPanelOpen: false,
  isColorPanelOpen: false,
  colorPanelTarget: null,
  colorPanelInitialColor: null,
  documentColors: [],
  vectorizerInputImage: null,
  selectedObjectProps: null,
  pages: [{ id: 'page-1', name: 'Figure 1' }],
  activePageIndex: 0,
  canUndo: false,
  canRedo: false,

  setPreset: (preset) =>
    set((state) => {
      if (preset === 'Custom') {
        return {
          documentConfig: {
            ...state.documentConfig,
            preset: 'Custom',
          },
        };
      }
      const def = PRESET_DEFINITIONS[preset];
      return {
        documentConfig: {
          preset,
          widthMm: def.widthMm,
          heightMm: def.heightMm,
          marginsMm: { ...def.marginsMm },
          columns: def.columns,
          columnGapMm: def.columnGapMm,
          orientation: state.documentConfig.orientation,
        },
      };
    }),

  setDimensions: (widthMm, heightMm) =>
    set((state) => ({
      documentConfig: {
        ...state.documentConfig,
        preset: 'Custom',
        widthMm: Math.max(10, widthMm),
        heightMm: Math.max(10, heightMm),
      },
    })),

  setOrientation: (orientation) =>
    set((state) => ({
      documentConfig: {
        ...state.documentConfig,
        orientation,
      },
    })),

  setMargins: (marginsMm) =>
    set((state) => ({
      documentConfig: {
        ...state.documentConfig,
        marginsMm,
      },
    })),

  setColumns: (columns, columnGapMm) =>
    set((state) => ({
      documentConfig: {
        ...state.documentConfig,
        columns: Math.max(1, columns),
        columnGapMm: Math.max(0, columnGapMm),
      },
    })),

  setActiveTool: (activeTool) => set({ activeTool }),

  setZoomPercent: (zoomPercent) => set({ zoomPercent: Math.round(zoomPercent) }),

  toggleMargins: () => set((state) => ({ showMargins: !state.showMargins })),

  toggleColumns: () => set((state) => ({ showColumns: !state.showColumns })),

  setSelectedObjects: (count) =>
    set({
      selectedObjectCount: count,
      hasSelectedObject: count > 0,
      selectedObjectProps: count === 0 ? null : undefined, // cleared when no object selected
    }),

  setArtboardBackgroundColor: (backgroundColor) =>
    set((state) => ({
      documentConfig: {
        ...state.documentConfig,
        backgroundColor,
      },
    })),

  toggleShapesDrawer: () =>
    set((state) => ({
      isShapesDrawerOpen: !state.isShapesDrawerOpen,
      isAssetDrawerOpen: !state.isShapesDrawerOpen ? false : state.isAssetDrawerOpen,
      isUploadsDrawerOpen: !state.isShapesDrawerOpen ? false : state.isUploadsDrawerOpen,
      isColorPanelOpen: !state.isShapesDrawerOpen ? false : state.isColorPanelOpen,
      colorPanelTarget: !state.isShapesDrawerOpen ? null : state.colorPanelTarget,
    })),

  setShapesDrawerOpen: (isShapesDrawerOpen) =>
    set((state) => ({
      isShapesDrawerOpen,
      isAssetDrawerOpen: isShapesDrawerOpen ? false : state.isAssetDrawerOpen,
      isUploadsDrawerOpen: isShapesDrawerOpen ? false : state.isUploadsDrawerOpen,
    })),

  toggleAssetDrawer: () =>
    set((state) => ({
      isAssetDrawerOpen: !state.isAssetDrawerOpen,
      isShapesDrawerOpen: !state.isAssetDrawerOpen ? false : state.isShapesDrawerOpen,
      isUploadsDrawerOpen: !state.isAssetDrawerOpen ? false : state.isUploadsDrawerOpen,
      isColorPanelOpen: !state.isAssetDrawerOpen ? false : state.isColorPanelOpen,
      colorPanelTarget: !state.isAssetDrawerOpen ? null : state.colorPanelTarget,
    })),

  setAssetDrawerOpen: (isAssetDrawerOpen) =>
    set((state) => ({
      isAssetDrawerOpen,
      isShapesDrawerOpen: isAssetDrawerOpen ? false : state.isShapesDrawerOpen,
      isUploadsDrawerOpen: isAssetDrawerOpen ? false : state.isUploadsDrawerOpen,
    })),

  toggleUploadsDrawer: () =>
    set((state) => ({
      isUploadsDrawerOpen: !state.isUploadsDrawerOpen,
      isShapesDrawerOpen: !state.isUploadsDrawerOpen ? false : state.isShapesDrawerOpen,
      isAssetDrawerOpen: !state.isUploadsDrawerOpen ? false : state.isAssetDrawerOpen,
      isColorPanelOpen: !state.isUploadsDrawerOpen ? false : state.isColorPanelOpen,
      colorPanelTarget: !state.isUploadsDrawerOpen ? null : state.colorPanelTarget,
    })),

  setUploadsDrawerOpen: (isUploadsDrawerOpen) =>
    set((state) => ({
      isUploadsDrawerOpen,
      isShapesDrawerOpen: isUploadsDrawerOpen ? false : state.isShapesDrawerOpen,
      isAssetDrawerOpen: isUploadsDrawerOpen ? false : state.isAssetDrawerOpen,
    })),

  openVectorizer: (imageSource) =>
    set({
      isVectorizerOpen: true,
      vectorizerInputImage: imageSource || null,
    }),

  closeVectorizer: () =>
    set({
      isVectorizerOpen: false,
      vectorizerInputImage: null,
    }),

  togglePropertiesPanel: () =>
    set((state) => ({ isPropertiesPanelOpen: !state.isPropertiesPanelOpen })),

  setPropertiesPanelOpen: (isPropertiesPanelOpen) =>
    set({ isPropertiesPanelOpen }),

  openColorPanel: (target, initialColor = null) =>
    set({
      isColorPanelOpen: true,
      colorPanelTarget: target,
      colorPanelInitialColor: initialColor,
      isShapesDrawerOpen: false,
      isAssetDrawerOpen: false,
      isUploadsDrawerOpen: false,
    }),

  closeColorPanel: () =>
    set({ isColorPanelOpen: false, colorPanelTarget: null, colorPanelInitialColor: null }),

  setDocumentColors: (documentColors) => set({ documentColors }),

  setSelectedObjectProps: (selectedObjectProps) => set({ selectedObjectProps }),
  setUndoRedoState: (canUndo, canRedo) => set({ canUndo, canRedo }),
  addPage: () =>
    set((state) => {
      const nextNum = state.pages.length + 1;
      const newPage: DocumentPage = {
        id: `page-${Date.now()}`,
        name: `Figure ${nextNum}`,
      };
      return {
        pages: [...state.pages, newPage],
        activePageIndex: state.pages.length,
      };
    }),
  removePage: (index) =>
    set((state) => {
      if (state.pages.length <= 1) return state;
      const filtered = state.pages.filter((_, i) => i !== index);
      const newActive = Math.min(state.activePageIndex, filtered.length - 1);
      return {
        pages: filtered,
        activePageIndex: newActive,
      };
    }),
  setActivePageIndex: (activePageIndex) => set({ activePageIndex }),
  duplicatePage: (index) =>
    set((state) => {
      const source = state.pages[index];
      if (!source) return state;
      const duplicated: DocumentPage = {
        id: `page-${Date.now()}`,
        name: `${source.name} (Copy)`,
        canvasJson: source.canvasJson ? JSON.parse(JSON.stringify(source.canvasJson)) : undefined,
      };
      const updated = [...state.pages];
      updated.splice(index + 1, 0, duplicated);
      return {
        pages: updated,
        activePageIndex: index + 1,
      };
    }),
  updatePageCanvas: (index, json) =>
    set((state) => {
      const updated = [...state.pages];
      if (updated[index]) {
        updated[index] = { ...updated[index], canvasJson: json };
      }
      return { pages: updated };
    }),
}));
