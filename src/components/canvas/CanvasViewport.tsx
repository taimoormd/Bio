import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { CanvasEngine, type SelectionBounds } from '../../core/canvas/CanvasEngine';
import { useEditorStore } from '../../stores/useEditorStore';
import { FloatingActionBar } from './FloatingActionBar';
import { UnifiedBottomBar } from './UnifiedBottomBar';

import type { Canvas } from 'fabric';

export interface CanvasViewportHandle {
  fitToScreen: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  addTextbox: () => void;
  addRect: () => void;
  addCircle: () => void;
  addSvgFromUrl: (url: string, position?: { x: number; y: number }, meta?: any) => Promise<any>;
  addSvgFromString: (svgString: string, position?: { x: number; y: number }, meta?: any) => Promise<any>;
  addImageFromUrl: (url: string, position?: { x: number; y: number }) => Promise<any>;
  addMembrane: (params?: any) => void;
  addDna: (params?: any) => void;
  addActivationArrow: () => void;
  addInhibitionArrow: () => void;
  updateActiveBioParams: (params: any) => void;
  setSelectionFill: (color: string) => void;
  setSelectionStroke: (color: string, width?: number) => void;
  setSelectionOpacity: (opacity: number) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  getPageJSON: () => any;
  loadPageJSON: (json?: any) => Promise<void>;
  getFabricCanvas: () => Canvas | null;

  // Formatting & Canvas Productivity Methods
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  selectAll: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleLockSelected: () => void;
  flipX: () => void;
  flipY: () => void;
  setSelectionX: (x: number) => void;
  setSelectionY: (y: number) => void;
  setSelectionWidth: (w: number) => void;
  setSelectionHeight: (h: number) => void;
  setSelectionAngle: (angle: number) => void;
  alignSelected: (alignment: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  distributeSelected: (direction: 'horizontal' | 'vertical') => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  setTextBackgroundColor: (color: string) => void;
  setLineHeight: (val: number) => void;
  setCharSpacing: (val: number) => void;
  changeTextCase: (mode: 'uppercase' | 'lowercase' | 'titlecase') => void;
  insertTextAtCursor: (chars: string) => void;
  setStrokeDashStyle: (style: 'solid' | 'dashed' | 'dotted' | 'dash-dot') => void;
  setStrokeLineJoin: (join: 'miter' | 'round' | 'bevel') => void;
  setStrokeLineCap: (cap: 'butt' | 'round' | 'square') => void;
  setCornerRadius: (radius: number) => void;
  setDropShadow: (enabled: boolean, options?: any) => void;
  applyImageFilter: (filterType: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale' | 'invert', value: number | boolean) => void;
  addProceduralShape: (shapeId: string, position?: { x: number; y: number }) => void;
  setArtboardBackgroundColor: (color: string) => void;
  replaceColor: (oldHex: string, newHex: string) => void;
}

export const CanvasViewport = forwardRef<CanvasViewportHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [selectionBounds, setSelectionBounds] = useState<SelectionBounds | null>(null);

  const {
    documentConfig,
    activeTool,
    showMargins,
    showColumns,
    zoomPercent,
    setZoomPercent,
    setSelectedObjects,
    selectedObjectProps,
    setSelectedObjectProps,
    pages,
    activePageIndex,
    setActivePageIndex,
    addPage,
    removePage,
    duplicatePage,
    updatePageCanvas,
    setUndoRedoState,
    setDocumentColors,
  } = useEditorStore();

  // Initialize CanvasEngine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const engine = new CanvasEngine(
      canvasRef.current,
      containerRef.current,
      documentConfig,
      {
        onZoomChange: (zoom) => setZoomPercent(zoom),
        onSelectionChange: (count) => setSelectedObjects(count),
        onPropertiesChange: (props) => setSelectedObjectProps(props),
        onSelectionBoundsChange: (bounds) => setSelectionBounds(bounds),
        onUndoRedoChange: (canUndo, canRedo) => setUndoRedoState(canUndo, canRedo),
        onDocumentColorsChange: (colors) => setDocumentColors(colors),
      }
    );

    engineRef.current = engine;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      if (engineRef.current) {
        engineRef.current.resizeToContainer();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync document config changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateDocumentConfig(documentConfig);
      engineRef.current.fitArtboardToViewport();
    }
  }, [documentConfig]);

  // Sync guideline visibility
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setGuidelinesVisibility(showMargins, showColumns);
    }
  }, [showMargins, showColumns]);

  // Sync active tool
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTool(activeTool);
    }
  }, [activeTool]);

  // Page switching handlers
  const handleSelectPage = async (targetIndex: number) => {
    if (targetIndex === activePageIndex || !engineRef.current) return;
    const currentJson = engineRef.current.getPageJSON();
    updatePageCanvas(activePageIndex, currentJson);
    setActivePageIndex(targetIndex);
    const targetPage = pages[targetIndex];
    await engineRef.current.loadPageJSON(targetPage?.canvasJson);
    engineRef.current.fitArtboardToViewport();
  };

  const handleAddPage = async () => {
    if (!engineRef.current) return;
    const currentJson = engineRef.current.getPageJSON();
    updatePageCanvas(activePageIndex, currentJson);
    addPage();
    await engineRef.current.loadPageJSON(undefined);
    engineRef.current.fitArtboardToViewport();
  };

  const handleDuplicatePage = async (index: number) => {
    if (!engineRef.current) return;
    if (index === activePageIndex) {
      const currentJson = engineRef.current.getPageJSON();
      updatePageCanvas(index, currentJson);
    }
    const sourcePage = pages[index];
    duplicatePage(index);
    if (sourcePage) {
      await engineRef.current.loadPageJSON(sourcePage.canvasJson);
      engineRef.current.fitArtboardToViewport();
    }
  };

  const handleDeletePage = async (index: number) => {
    if (pages.length <= 1 || !engineRef.current) return;
    const nextIndex = Math.max(
      0,
      index === activePageIndex
        ? index > 0
          ? index - 1
          : 0
        : activePageIndex - (index < activePageIndex ? 1 : 0)
    );
    removePage(index);
    const targetPage = pages[nextIndex];
    await engineRef.current.loadPageJSON(targetPage?.canvasJson);
    engineRef.current.fitArtboardToViewport();
  };

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    fitToScreen: () => engineRef.current?.fitArtboardToViewport(),
    zoomIn: () => engineRef.current?.zoomIn(),
    zoomOut: () => engineRef.current?.zoomOut(),
    addTextbox: () => engineRef.current?.addTextbox(),
    addRect: () => engineRef.current?.addRect(),
    addCircle: () => engineRef.current?.addCircle(),
    addSvgFromUrl: (url, pos, meta) =>
      engineRef.current
        ? engineRef.current.addSvgFromUrl(url, pos, meta)
        : Promise.resolve(null),
    addSvgFromString: (svg, pos, meta) =>
      engineRef.current
        ? engineRef.current.addSvgFromString(svg, pos, meta)
        : Promise.resolve(null),
    addImageFromUrl: (url, pos) =>
      engineRef.current
        ? engineRef.current.addImageFromUrl(url, pos)
        : Promise.resolve(null),
    addMembrane: (params) => engineRef.current?.addMembrane(params),
    addDna: (params) => engineRef.current?.addDna(params),
    addActivationArrow: () => engineRef.current?.addActivationArrow(),
    addInhibitionArrow: () => engineRef.current?.addInhibitionArrow(),
    updateActiveBioParams: (params) => engineRef.current?.updateActiveBioParams(params),
    setSelectionFill: (color) => engineRef.current?.setSelectionFill(color),
    setSelectionStroke: (color, width) => engineRef.current?.setSelectionStroke(color, width),
    setSelectionOpacity: (opacity) => engineRef.current?.setSelectionOpacity(opacity),
    deleteSelected: () => engineRef.current?.deleteActiveObjects(),
    duplicateSelected: () => engineRef.current?.duplicateActiveObjects(),
    bringForward: () => engineRef.current?.bringForward(),
    sendBackward: () => engineRef.current?.sendBackward(),
    bringToFront: () => engineRef.current?.bringToFront(),
    sendToBack: () => engineRef.current?.sendToBack(),
    getPageJSON: () => engineRef.current?.getPageJSON(),
    loadPageJSON: (json) =>
      engineRef.current ? engineRef.current.loadPageJSON(json) : Promise.resolve(),
    getFabricCanvas: () => (engineRef.current ? engineRef.current.canvas : null),

    // Formatting & Canvas Productivity Methods
    undo: () => engineRef.current?.undo(),
    redo: () => engineRef.current?.redo(),
    copy: () => engineRef.current?.copyActiveObjects(),
    paste: () => engineRef.current?.pasteObjects(),
    selectAll: () => engineRef.current?.selectAll(),
    groupSelected: () => engineRef.current?.groupActiveSelection(),
    ungroupSelected: () => engineRef.current?.ungroupActiveObject(),
    toggleLockSelected: () => engineRef.current?.toggleLockActiveObjects(),
    flipX: () => engineRef.current?.toggleFlipX(),
    flipY: () => engineRef.current?.toggleFlipY(),
    setSelectionX: (x) => engineRef.current?.setSelectionX(x),
    setSelectionY: (y) => engineRef.current?.setSelectionY(y),
    setSelectionWidth: (w) => engineRef.current?.setSelectionWidth(w),
    setSelectionHeight: (h) => engineRef.current?.setSelectionHeight(h),
    setSelectionAngle: (angle) => engineRef.current?.setSelectionAngle(angle),
    alignSelected: (alignment) => engineRef.current?.alignObjects(alignment),
    distributeSelected: (direction) => engineRef.current?.distributeObjects(direction),
    setFontFamily: (family) => engineRef.current?.setFontFamily(family),
    setFontSize: (size) => engineRef.current?.setFontSize(size),
    toggleBold: () => engineRef.current?.toggleBold(),
    toggleItalic: () => engineRef.current?.toggleItalic(),
    toggleUnderline: () => engineRef.current?.toggleUnderline(),
    toggleStrikethrough: () => engineRef.current?.toggleStrikethrough(),
    setTextAlign: (align) => engineRef.current?.setTextAlign(align),
    setTextBackgroundColor: (color) => engineRef.current?.setTextBackgroundColor(color),
    setLineHeight: (val) => engineRef.current?.setLineHeight(val),
    setCharSpacing: (val) => engineRef.current?.setCharSpacing(val),
    changeTextCase: (mode) => engineRef.current?.changeTextCase(mode),
    insertTextAtCursor: (chars) => engineRef.current?.insertTextAtCursor(chars),
    setStrokeDashStyle: (style) => engineRef.current?.setStrokeDashStyle(style),
    setStrokeLineJoin: (join) => engineRef.current?.setStrokeLineJoin(join),
    setStrokeLineCap: (cap) => engineRef.current?.setStrokeLineCap(cap),
    setCornerRadius: (radius) => engineRef.current?.setCornerRadius(radius),
    setDropShadow: (enabled, options) => engineRef.current?.setDropShadow(enabled, options),
    applyImageFilter: (filterType, val) => engineRef.current?.applyImageFilter(filterType, val),
    addProceduralShape: (shapeId, pos) => engineRef.current?.addProceduralShape(shapeId, pos),
    setArtboardBackgroundColor: (color) => engineRef.current?.setArtboardBackgroundColor(color),
    replaceColor: (oldHex, newHex) => engineRef.current?.replaceColorInSelection(oldHex, newHex),
  }));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-workspace focus:outline-hidden"
    >
      <canvas ref={canvasRef} />

      {/* Minimalist Floating Action Bar (Duplicate, Lock, Layer, Delete) */}
      <FloatingActionBar
        bounds={selectionBounds}
        isLocked={selectedObjectProps?.isLocked}
        onDuplicate={() => engineRef.current?.duplicateActiveObjects()}
        onToggleLock={() => engineRef.current?.toggleLockActiveObjects()}
        onBringForward={() => engineRef.current?.bringForward()}
        onSendBackward={() => engineRef.current?.sendBackward()}
        onDelete={() => engineRef.current?.deleteActiveObjects()}
      />

      {/* Consolidated Floating Bottom Pill (Figures + Add + Dimensions + Zoom + Fit) */}
      <UnifiedBottomBar
        pages={pages}
        activePageIndex={activePageIndex}
        zoomPercent={zoomPercent}
        documentConfig={documentConfig}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onZoomIn={() => engineRef.current?.zoomIn()}
        onZoomOut={() => engineRef.current?.zoomOut()}
        onFitToScreen={() => engineRef.current?.fitArtboardToViewport(60)}
        onResetZoom={() => engineRef.current?.setZoom(100)}
      />
    </div>
  );
});

CanvasViewport.displayName = 'CanvasViewport';
