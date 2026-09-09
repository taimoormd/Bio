import {
  Canvas,
  Rect,
  Circle,
  Textbox,
  Point,
  loadSVGFromURL,
  loadSVGFromString,
  FabricImage,
  util,
  Group,
  FabricObject,
  ActiveSelection,
  Shadow,
  filters,
} from 'fabric';
import {
  DocumentConfig,
  getEffectiveDimensionsMm,
  mmToPx,
} from '../document/types';
import { ToolType, SelectedObjectProps } from '../../stores/useEditorStore';
import {
  createMembraneGroup,
  type MembraneParams,
} from '../../engines/procedural/membrane';
import { createDnaGroup, type DnaParams } from '../../engines/procedural/dna';
import { createPathwayConnector } from '../../engines/procedural/arrows';
import { SHAPE_CATALOG } from '../../engines/procedural/shapes';
import { extractSvgPalette, replaceColorInObject, extractDocumentColors } from './colorUtils';

export interface SelectionBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CanvasEngineOptions {
  onZoomChange?: (zoomPercent: number) => void;
  onSelectionChange?: (count: number) => void;
  onPropertiesChange?: (props: SelectedObjectProps | null) => void;
  onSelectionBoundsChange?: (bounds: SelectionBounds | null) => void;
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void;
  onDocumentColorsChange?: (colors: string[]) => void;
}

export class CanvasEngine {
  public canvas: Canvas;
  private containerElement: HTMLElement;
  private docConfig: DocumentConfig;
  private options: CanvasEngineOptions;
  private currentTool: ToolType = 'select';
  private isPanning = false;
  private lastPanPoint: { x: number; y: number } | null = null;
  private isSpacePressed = false;
  private isAltPressed = false;
  private showMargins = true;
  private showColumns = true;

  // History / Undo-Redo Stack
  private historyStack: string[] = [];
  private historyIndex = -1;
  private isHistoryLocked = false;
  private maxHistoryStates = 50;

  // Clipboard
  private clipboard: FabricObject | null = null;

  constructor(
    canvasElement: HTMLCanvasElement,
    containerElement: HTMLElement,
    docConfig: DocumentConfig,
    options: CanvasEngineOptions = {}
  ) {
    this.containerElement = containerElement;
    this.docConfig = docConfig;
    this.options = options;

    // Initialize Fabric Canvas with transparent background (rendered dynamically in before:render)
    this.canvas = new Canvas(canvasElement, {
      backgroundColor: '',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    this.setupRenderHooks();
    this.setupViewportEvents();
    this.setupSelectionEvents();
    this.setupKeyboardEvents();
    this.setupDragAndDropEvents();

    this.resizeToContainer();
    this.fitArtboardToViewport(60);
    this.saveHistory();
  }

  // ---------------------------------------------------------------------------
  // 1. RENDER HOOKS (Artboard & Non-interactive Scientific Guidelines)
  // ---------------------------------------------------------------------------
  private setupRenderHooks(): void {
    // Top-left of artboard is strictly (0, 0) in canvas space.
    // 'before:render' draws the darker neutral gray workspace and the crisp white artboard with drop shadow.
    this.canvas.on('before:render', (opt: any) => {
      const ctx = opt?.ctx || this.canvas.getContext();
      if (!ctx) return;

      // During export, fill with artboard background color and skip outer workspace & shadows
      if ((this.canvas as any).__isExporting) {
        ctx.fillStyle = this.docConfig.backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, ctx.canvas?.width || this.canvas.width || 0, ctx.canvas?.height || this.canvas.height || 0);
        return;
      }

      const width = this.canvas.width || this.containerElement.clientWidth;
      const height = this.canvas.height || this.containerElement.clientHeight;

      // 1. Fill entire outer workspace with distinct, darker neutral gray (#E2E8F0)
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(0, 0, width, height);

      // 2. Calculate physical artboard dimensions in screen space
      const { widthMm, heightMm } = getEffectiveDimensionsMm(this.docConfig);
      const artboardW = mmToPx(widthMm);
      const artboardH = mmToPx(heightMm);
      const zoom = this.canvas.getZoom();
      const v = this.canvas.viewportTransform;

      const screenX = v[4];
      const screenY = v[5];
      const screenW = artboardW * zoom;
      const screenH = artboardH * zoom;

      ctx.save();
      // Soft, elegant drop shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.12)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;

      // Draw artboard surface with configured background color (default #FFFFFF)
      ctx.fillStyle = this.docConfig.backgroundColor || '#FFFFFF';
      ctx.fillRect(screenX, screenY, screenW, screenH);

      // 1px subtle boundary border: 1px solid rgba(0, 0, 0, 0.08)
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, screenW, screenH);

      ctx.restore();
    });

    // 'after:render' renders non-interactive hairline guidelines directly to 2D context
    this.canvas.on('after:render', (opt: any) => {
      if ((this.canvas as any).__isExporting) return;
      const ctx = opt?.ctx || this.canvas.getContext();
      if (!ctx) return;

      const { widthMm, heightMm } = getEffectiveDimensionsMm(this.docConfig);
      const artboardW = mmToPx(widthMm);
      const artboardH = mmToPx(heightMm);
      const zoom = this.canvas.getZoom();
      const v = this.canvas.viewportTransform;
      const hairline = 1 / zoom; // Exactly 1 physical screen pixel at any zoom level

      const top = mmToPx(this.docConfig.marginsMm.top);
      const bottom = artboardH - mmToPx(this.docConfig.marginsMm.bottom);
      const left = mmToPx(this.docConfig.marginsMm.left);
      const right = artboardW - mmToPx(this.docConfig.marginsMm.right);

      ctx.save();
      // Apply viewport transform so guidelines coordinate space matches artboard space precisely
      ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);

      // 1. Draw Margin Boundary Guides (Subtle 40% blue hairline)
      if (this.showMargins) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; // blue-500 @ 40%
        ctx.lineWidth = hairline;
        ctx.setLineDash([6 / zoom, 4 / zoom]);

        ctx.strokeRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
      }

      // 2. Draw Column Snap Guides & Gutters (Subtle 40% purple hairline)
      if (this.showColumns && this.docConfig.columns > 1) {
        const columns = this.docConfig.columns;
        const colGapPx = mmToPx(this.docConfig.columnGapMm);
        const printableWidth = right - left;
        const totalGaps = (columns - 1) * colGapPx;
        const colWidth = (printableWidth - totalGaps) / columns;

        if (colWidth > 0) {
          ctx.lineWidth = hairline;
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)'; // purple-500 @ 40%
          ctx.setLineDash([4 / zoom, 4 / zoom]);

          for (let i = 0; i < columns; i++) {
            const colLeft = left + i * (colWidth + colGapPx);
            const colRight = colLeft + colWidth;

            // Left column boundary
            ctx.beginPath();
            ctx.moveTo(colLeft, top);
            ctx.lineTo(colLeft, bottom);
            ctx.stroke();

            // Right column boundary
            ctx.beginPath();
            ctx.moveTo(colRight, top);
            ctx.lineTo(colRight, bottom);
            ctx.stroke();

            // Gutter highlight between columns
            if (i < columns - 1 && colGapPx > 0) {
              ctx.fillStyle = 'rgba(139, 92, 246, 0.05)';
              ctx.fillRect(colRight, top, colGapPx, bottom - top);
            }
          }
        }
      }

      ctx.restore();
    });
  }

  // ---------------------------------------------------------------------------
  // 2. VIEWPORT CONTROLS (Smooth Pan & Zoom, Centered via viewportTransform)
  // ---------------------------------------------------------------------------
  private setupViewportEvents(): void {
    this.canvas.on('mouse:wheel', (opt) => {
      const evt = opt.e as WheelEvent;
      evt.preventDefault();
      evt.stopPropagation();

      const isZoomGesture = evt.ctrlKey || evt.metaKey;

      if (isZoomGesture) {
        const delta = evt.deltaY;
        const zoom = this.canvas.getZoom();
        const zoomFactor = Math.exp(-delta * 0.005);
        let newZoom = zoom * zoomFactor;
        newZoom = Math.min(Math.max(0.05, newZoom), 8.0);

        const rect = this.containerElement.getBoundingClientRect();
        const point = new Point(evt.clientX - rect.left, evt.clientY - rect.top);
        this.canvas.zoomToPoint(point, newZoom);
        this.notifyZoomChange();
        this.updateSelectionBounds();
      } else {
        // Native two-finger trackpad panning (or mouse wheel pan)
        let dx = evt.deltaX;
        let dy = evt.deltaY;
        if (evt.shiftKey && dx === 0) {
          dx = dy;
          dy = 0;
        }

        const vpt = this.canvas.viewportTransform;
        vpt[4] -= dx;
        vpt[5] -= dy;
        this.canvas.setViewportTransform(vpt);
        this.canvas.requestRenderAll();
        this.updateSelectionBounds();
      }
    });

    this.canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      const isMiddleClick = evt.button === 1;
      const isPanTrigger =
        this.currentTool === 'pan' ||
        this.isSpacePressed ||
        this.isAltPressed ||
        isMiddleClick;

      if (isPanTrigger) {
        this.isPanning = true;
        this.lastPanPoint = { x: evt.clientX, y: evt.clientY };
        this.canvas.selection = false;
        this.updateCursor('grabbing');
      }
    });

    this.canvas.on('mouse:move', (opt) => {
      if (this.isPanning && this.lastPanPoint) {
        const evt = opt.e as MouseEvent;
        const deltaX = evt.clientX - this.lastPanPoint.x;
        const deltaY = evt.clientY - this.lastPanPoint.y;
        this.lastPanPoint = { x: evt.clientX, y: evt.clientY };

        const vpt = this.canvas.viewportTransform;
        vpt[4] += deltaX;
        vpt[5] += deltaY;
        this.canvas.setViewportTransform(vpt);
        this.canvas.requestRenderAll();
        this.updateSelectionBounds();
      }
    });

    this.canvas.on('mouse:up', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.lastPanPoint = null;
        if (this.currentTool === 'pan' || this.isSpacePressed || this.isAltPressed) {
          this.updateCursor('grab');
        } else {
          this.canvas.selection = true;
          this.updateCursor('default');
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 3. KEYBOARD SHORTCUTS & DELETE GUARD
  // ---------------------------------------------------------------------------
  private setupKeyboardEvents(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const activeEl = document.activeElement;
        const inInput =
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true');

        const activeObjects = this.canvas.getActiveObjects();
        const isEditingText = activeObjects.some((obj: any) => obj.isEditing);

        if (!inInput && !isEditingText) {
          e.preventDefault();
          this.isSpacePressed = true;
          this.canvas.selection = false;
          this.updateCursor('grab');

          this.canvas.forEachObject((obj) => {
            (obj as any).__origEvented = obj.evented;
            obj.evented = false;
          });
        }
      }

      if (e.key === 'Alt' && !e.repeat) {
        this.isAltPressed = true;
        this.canvas.selection = false;
        this.updateCursor('grab');
      }

      // Keyboard Shortcuts (Guarded against inputs and text editing)
      const activeEl = document.activeElement;
      const inInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true');
      const activeObjects = this.canvas.getActiveObjects();
      const isEditingText = activeObjects.some((obj: any) => obj.isEditing);

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (!inInput && !isEditingText) {
        // Undo: Ctrl+Z / Cmd+Z (without Shift)
        if (isCmdOrCtrl && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
          e.preventDefault();
          this.undo();
          return;
        }

        // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
        if (
          (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y')) ||
          (isCmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
        ) {
          e.preventDefault();
          this.redo();
          return;
        }

        // Copy: Ctrl+C / Cmd+C
        if (isCmdOrCtrl && (e.key === 'c' || e.key === 'C')) {
          e.preventDefault();
          this.copyActiveObjects();
          return;
        }

        // Paste: Ctrl+V / Cmd+V
        if (isCmdOrCtrl && (e.key === 'v' || e.key === 'V')) {
          e.preventDefault();
          this.pasteObjects();
          return;
        }

        // Select All: Ctrl+A / Cmd+A
        if (isCmdOrCtrl && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          this.selectAll();
          return;
        }

        // Duplicate: Ctrl+D / Cmd+D
        if (isCmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          this.duplicateActiveObjects();
          return;
        }

        // Group: Ctrl+G / Cmd+G (without Shift)
        if (isCmdOrCtrl && (e.key === 'g' || e.key === 'G') && !e.shiftKey) {
          e.preventDefault();
          this.groupActiveSelection();
          return;
        }

        // Ungroup: Ctrl+Shift+G / Cmd+Shift+G
        if (isCmdOrCtrl && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
          e.preventDefault();
          this.ungroupActiveObject();
          return;
        }

        // Layer Ordering Shortcuts: [ (backward), ] (forward)
        if (e.key === '[') {
          e.preventDefault();
          this.sendBackward();
          return;
        }
        if (e.key === ']') {
          e.preventDefault();
          this.bringForward();
          return;
        }

        // Arrow Key Nudging (1px, or 10px with Shift)
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          const active = this.canvas.getActiveObject();
          if (active) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            if (e.key === 'ArrowLeft') active.set('left', (active.left || 0) - step);
            else if (e.key === 'ArrowRight') active.set('left', (active.left || 0) + step);
            else if (e.key === 'ArrowUp') active.set('top', (active.top || 0) - step);
            else if (e.key === 'ArrowDown') active.set('top', (active.top || 0) + step);
            active.setCoords();
            this.canvas.requestRenderAll();
            this.updateSelectionBounds();
            this.updateSelectedProperties();
            this.debounceSaveHistory();
            return;
          }
        }
      }

      // Delete / Backspace Guard: ONLY remove shapes when NOT editing text
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!activeObjects || activeObjects.length === 0 || isEditingText || inInput) return;
        e.preventDefault();
        this.deleteActiveObjects();
      }

      // Fit to screen shortcut: Shift+1 (or !)
      if (e.shiftKey && (e.key === '!' || e.key === '1' || e.code === 'Digit1')) {
        if (!inInput && !isEditingText) {
          e.preventDefault();
          this.fitArtboardToViewport(60);
        }
      }

      if (e.key === 'Escape') {
        this.setTool('select');
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();
        this.updateSelectedProperties();
        this.updateSelectionBounds();
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        if (this.currentTool === 'select') {
          this.canvas.selection = true;
          this.updateCursor('default');
        }
        this.canvas.forEachObject((obj) => {
          if ((obj as any).__origEvented !== undefined) {
            obj.evented = (obj as any).__origEvented;
            delete (obj as any).__origEvented;
          } else {
            obj.evented = true;
          }
        });
      }
      if (e.key === 'Alt') {
        this.isAltPressed = false;
        if (this.currentTool === 'select') {
          this.canvas.selection = true;
          this.updateCursor('default');
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. SELECTION & PROPERTIES EVENTS
  // ---------------------------------------------------------------------------
  private setupSelectionEvents(): void {
    this.canvas.on('selection:created', (e) => {
      this.options.onSelectionChange?.(e.selected?.length || 0);
      this.updateSelectedProperties();
      this.updateSelectionBounds();
    });

    this.canvas.on('selection:updated', (e) => {
      this.options.onSelectionChange?.(e.selected?.length || 0);
      this.updateSelectedProperties();
      this.updateSelectionBounds();
    });

    this.canvas.on('selection:cleared', () => {
      this.options.onSelectionChange?.(0);
      this.options.onPropertiesChange?.(null);
      this.options.onSelectionBoundsChange?.(null);
    });

    this.canvas.on('object:moving', () => {
      this.updateSelectionBounds();
      this.updateSelectedProperties();
    });

    this.canvas.on('object:scaling', () => {
      this.updateSelectionBounds();
      this.updateSelectedProperties();
    });

    this.canvas.on('object:rotating', () => {
      this.updateSelectionBounds();
      this.updateSelectedProperties();
    });

    this.canvas.on('object:modified', () => {
      this.updateSelectionBounds();
      this.updateSelectedProperties();
      this.saveHistory();
    });
  }

  public updateSelectionBounds(): void {
    const active = this.canvas.getActiveObject();
    if (!active || !this.options.onSelectionBoundsChange) {
      this.options.onSelectionBoundsChange?.(null);
      return;
    }

    const vpt = this.canvas.viewportTransform;
    if (!vpt) {
      const rect = active.getBoundingRect();
      this.options.onSelectionBoundsChange({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
      return;
    }

    // Transform active object corner coordinates through the canvas viewport transform
    const coords = (active.getCoords ? active.getCoords() : [
      new Point(active.left, active.top),
      new Point(active.left + active.width, active.top),
      new Point(active.left + active.width, active.top + active.height),
      new Point(active.left, active.top + active.height),
    ]).map((p) => util.transformPoint(p, vpt));

    const minX = Math.min(...coords.map((p) => p.x));
    const maxX = Math.max(...coords.map((p) => p.x));
    const minY = Math.min(...coords.map((p) => p.y));
    const maxY = Math.max(...coords.map((p) => p.y));

    this.options.onSelectionBoundsChange({
      left: minX,
      top: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    });
  }

  private updateSelectedProperties(): void {
    const active = this.canvas.getActiveObject();
    if (!active) {
      this.options.onPropertiesChange?.(null);
      return;
    }

    const meta = (active as any).scientificMeta;
    let fill = typeof active.fill === 'string' ? active.fill : '#0D9488';
    let stroke = typeof active.stroke === 'string' ? active.stroke : '#0D9488';

    if (active instanceof Group && !((active as any).bioType)) {
      const children = active.getObjects();
      const childWithFill = children.find(
        (c) => c.fill && typeof c.fill === 'string' && c.fill !== 'none' && c.fill !== ''
      );
      if (childWithFill && typeof childWithFill.fill === 'string') {
        fill = childWithFill.fill;
      }
      const childWithStroke = children.find(
        (c) => c.stroke && typeof c.stroke === 'string' && c.stroke !== 'none' && c.stroke !== ''
      );
      if (childWithStroke && typeof childWithStroke.stroke === 'string') {
        stroke = childWithStroke.stroke;
      }
    }

    const isLocked = !!(active as any).isLocked || (active.lockMovementX && active.lockMovementY);
    const shadow = active.shadow as Shadow | null;
    const extractedColors = extractSvgPalette(active);

    const props: SelectedObjectProps = {
      type: active.type || 'object',
      fill,
      stroke,
      strokeWidth: active.strokeWidth || 0,
      opacity: active.opacity !== undefined ? active.opacity : 1,
      scientificMeta: meta,
      bioType: (active as any).bioType,
      membraneParams: (active as any).membraneParams,
      dnaParams: (active as any).dnaParams,
      arrowParams: (active as any).arrowParams,
      extractedColors: extractedColors.length > 0 ? extractedColors : undefined,

      // Geometry & Positioning
      left: Math.round(active.left || 0),
      top: Math.round(active.top || 0),
      width: Math.round((active.width || 0) * (active.scaleX || 1)),
      height: Math.round((active.height || 0) * (active.scaleY || 1)),
      scaleX: active.scaleX || 1,
      scaleY: active.scaleY || 1,
      angle: Math.round(active.angle || 0),
      flipX: !!active.flipX,
      flipY: !!active.flipY,
      isLocked,

      // Vector / Shape styling
      rx: (active as any).rx,
      ry: (active as any).ry,
      strokeDashArray: active.strokeDashArray,
      strokeLineJoin: active.strokeLineJoin,
      strokeLineCap: active.strokeLineCap,
      hasShadow: !!shadow,
      shadowColor: shadow ? shadow.color : undefined,
      shadowBlur: shadow ? shadow.blur : undefined,
      shadowOffsetX: shadow ? shadow.offsetX : undefined,
      shadowOffsetY: shadow ? shadow.offsetY : undefined,
    };

    if (active instanceof Textbox || active.type === 'textbox') {
      const tb = active as Textbox;
      props.text = tb.text;
      props.fontFamily = tb.fontFamily;
      props.fontSize = tb.fontSize;
      props.fontWeight = tb.fontWeight;
      props.fontStyle = tb.fontStyle;
      props.underline = tb.underline;
      props.linethrough = tb.linethrough;
      props.textAlign = tb.textAlign;
      props.textBackgroundColor = tb.textBackgroundColor;
      props.lineHeight = tb.lineHeight;
      props.charSpacing = tb.charSpacing;
    }

    if (active instanceof FabricImage || active.type === 'image') {
      const img = active as FabricImage;
      const fList = img.filters || [];
      const brightF = fList.find((f: any) => f?.type === 'Brightness') as any;
      const contrastF = fList.find((f: any) => f?.type === 'Contrast') as any;
      const satF = fList.find((f: any) => f?.type === 'Saturation') as any;
      const blurF = fList.find((f: any) => f?.type === 'Blur') as any;
      const grayF = fList.find((f: any) => f?.type === 'Grayscale') as any;
      const invertF = fList.find((f: any) => f?.type === 'Invert') as any;
      props.brightness = brightF ? brightF.brightness : 0;
      props.contrast = contrastF ? contrastF.contrast : 0;
      props.saturation = satF ? satF.saturation : 0;
      props.blur = blurF ? blurF.blur : 0;
      props.grayscale = !!grayF;
      props.invert = !!invertF;
    }

    this.options.onPropertiesChange?.(props);
    this.options.onDocumentColorsChange?.(this.getDocumentColors());
  }

  public getDocumentColors(): string[] {
    return extractDocumentColors(this.canvas.getObjects());
  }

  private debounceTimer: number | null = null;
  private debounceSaveHistory(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.saveHistory();
      this.debounceTimer = null;
    }, 250);
  }

  // ---------------------------------------------------------------------------
  // 5. HTML5 DRAG-AND-DROP PLACEMENT
  // ---------------------------------------------------------------------------
  private setupDragAndDropEvents(): void {
    this.containerElement.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    });

    this.containerElement.addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault();
      const scenePoint = this.canvas.getScenePoint(e);

      // 1. Handle file drops from OS (dragged directly from computer)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.includes('svg')) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const svgContent = event.target?.result as string;
            if (svgContent) {
              await this.addSvgFromString(svgContent, scenePoint);
            }
          };
          reader.readAsText(file);
          return;
        } else if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              await this.addImageFromUrl(dataUrl, scenePoint);
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      // 2. Handle in-app dragged assets
      const rawData = e.dataTransfer?.getData('application/json');
      if (!rawData) return;

      try {
        const item = JSON.parse(rawData);

        if (item.type === 'stored-image' && item.dataUrl) {
          await this.addImageFromUrl(item.dataUrl, scenePoint);
        } else if (item.type === 'stored-vector' && item.svgString) {
          await this.addSvgFromString(item.svgString, scenePoint);
        } else if (item.isProcedural) {
          if (item.generatorType === 'membrane') {
            this.addMembrane(undefined, scenePoint);
          } else if (item.generatorType === 'dna') {
            this.addDna(undefined, scenePoint);
          } else if (item.generatorType === 'activation') {
            this.addActivationArrow(scenePoint);
          } else if (item.generatorType === 'inhibition') {
            this.addInhibitionArrow(scenePoint);
          }
        } else if (item.type === 'procedural-shape' && item.shapeId) {
          this.addProceduralShape(item.shapeId, scenePoint);
        } else if (item.svgPath) {
          await this.addSvgFromUrl(item.svgPath, scenePoint, item);
        }
      } catch (err) {
        console.error('Failed to parse dropped asset data:', err);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 6. ARTBOARD CENTERING & VIEWPORT RESIZING
  // ---------------------------------------------------------------------------
  public resizeToContainer(): void {
    const width = this.containerElement.clientWidth || window.innerWidth;
    const height = this.containerElement.clientHeight || window.innerHeight;
    this.canvas.setDimensions({ width, height });
    this.canvas.requestRenderAll();
  }

  public fitArtboardToViewport(paddingPx = 60): void {
    const containerW = this.containerElement.clientWidth || window.innerWidth;
    const containerH = this.containerElement.clientHeight || window.innerHeight;

    const { widthMm, heightMm } = getEffectiveDimensionsMm(this.docConfig);
    const artboardW = mmToPx(widthMm);
    const artboardH = mmToPx(heightMm);

    const availableW = Math.max(100, containerW - paddingPx * 2);
    const availableH = Math.max(100, containerH - paddingPx * 2);

    const scale = Math.min(availableW / artboardW, availableH / artboardH);
    const clampedScale = Math.min(Math.max(0.01, scale), 4.0);

    const tx = (containerW - artboardW * clampedScale) / 2;
    const ty = (containerH - artboardH * clampedScale) / 2;

    this.canvas.setViewportTransform([clampedScale, 0, 0, clampedScale, tx, ty]);
    this.canvas.requestRenderAll();
    this.notifyZoomChange();
    this.updateSelectionBounds();
  }

  public zoomIn(): void {
    const currentZoom = this.canvas.getZoom();
    const newZoom = Math.min(currentZoom * 1.25, 6.0);
    const center = new Point(
      (this.containerElement.clientWidth || window.innerWidth) / 2,
      (this.containerElement.clientHeight || window.innerHeight) / 2
    );
    this.canvas.zoomToPoint(center, newZoom);
    this.notifyZoomChange();
  }

  public zoomOut(): void {
    const currentZoom = this.canvas.getZoom();
    const newZoom = Math.max(currentZoom / 1.25, 0.05);
    const center = new Point(
      (this.containerElement.clientWidth || window.innerWidth) / 2,
      (this.containerElement.clientHeight || window.innerHeight) / 2
    );
    this.canvas.zoomToPoint(center, newZoom);
    this.notifyZoomChange();
  }

  public setZoom(zoomPercent: number): void {
    const targetZoom = Math.min(Math.max(0.05, zoomPercent / 100), 6.0);
    const center = new Point(
      (this.containerElement.clientWidth || window.innerWidth) / 2,
      (this.containerElement.clientHeight || window.innerHeight) / 2
    );
    this.canvas.zoomToPoint(center, targetZoom);
    this.notifyZoomChange();
  }

  private notifyZoomChange(): void {
    const zoomPercent = Math.round(this.canvas.getZoom() * 100);
    this.options.onZoomChange?.(zoomPercent);
  }

  public updateDocumentConfig(config: DocumentConfig): void {
    this.docConfig = config;
    this.canvas.requestRenderAll();
  }

  public setGuidelinesVisibility(showMargins: boolean, showColumns: boolean): void {
    this.showMargins = showMargins;
    this.showColumns = showColumns;
    this.canvas.requestRenderAll();
  }

  public setTool(tool: ToolType): void {
    this.currentTool = tool;
    if (tool === 'pan') {
      this.canvas.selection = false;
      this.updateCursor('grab');
    } else {
      this.canvas.selection = true;
      this.updateCursor('default');
    }
  }

  private updateCursor(cursor: string): void {
    this.canvas.defaultCursor = cursor;
    this.canvas.hoverCursor = cursor;
  }

  // ---------------------------------------------------------------------------
  // 7. VECTOR CREATION & ASSET PLACEMENT
  // ---------------------------------------------------------------------------
  private getArtboardCenter(): { x: number; y: number } {
    const { widthMm, heightMm } = getEffectiveDimensionsMm(this.docConfig);
    return {
      x: mmToPx(widthMm) / 2,
      y: mmToPx(heightMm) / 2,
    };
  }

  public addTextbox(text = 'Double click to edit scientific text'): Textbox {
    const center = this.getArtboardCenter();
    const textbox = new Textbox(text, {
      left: center.x - 180,
      top: center.y - 40,
      width: 360,
      fontSize: 24,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#1E293B',
      stroke: '',
      strokeWidth: 0,
      editable: true,
      cornerColor: '#0284C7',
      cornerStyle: 'circle',
      borderColor: '#0284C7',
      transparentCorners: false,
    });

    this.canvas.add(textbox);
    this.canvas.setActiveObject(textbox);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return textbox;
  }

  public addRect(): Rect {
    const center = this.getArtboardCenter();
    const rect = new Rect({
      left: center.x - 100,
      top: center.y - 75,
      width: 200,
      height: 150,
      fill: '#E0F2FE',
      stroke: '#0284C7',
      strokeWidth: 2,
      rx: 8,
      ry: 8,
      cornerColor: '#0284C7',
      cornerStyle: 'circle',
      borderColor: '#0284C7',
      transparentCorners: false,
    });

    this.canvas.add(rect);
    this.canvas.setActiveObject(rect);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return rect;
  }

  public addCircle(): Circle {
    const center = this.getArtboardCenter();
    const circle = new Circle({
      left: center.x - 75,
      top: center.y - 75,
      radius: 75,
      fill: '#FEF3C7',
      stroke: '#F59E0B',
      strokeWidth: 2,
      cornerColor: '#F59E0B',
      cornerStyle: 'circle',
      borderColor: '#F59E0B',
      transparentCorners: false,
    });

    this.canvas.add(circle);
    this.canvas.setActiveObject(circle);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return circle;
  }

  /**
   * Load vector SVG from URL and insert into canvas with scientific metadata
   */
  public async addSvgFromUrl(
    url: string,
    position?: { x: number; y: number },
    meta?: any
  ): Promise<FabricObject | null> {
    try {
      const resolvedUrl = url.startsWith('/catalog/')
        ? url
        : url.startsWith('/svg/')
          ? `/catalog${url}`
          : url;
      const { objects, options } = await loadSVGFromURL(resolvedUrl);
      if (!objects || objects.length === 0) return null;

      const validObjects = objects.filter((o): o is FabricObject => o !== null);
      if (validObjects.length === 0) return null;

      // Group SVG elements using Fabric 7 util
      const svgGroup = util.groupSVGElements(validObjects, options);

      // Standardize size to approximately 50 mm (189 px)
      const targetSizePx = mmToPx(50);
      const currentWidth = svgGroup.width || 100;
      const currentHeight = svgGroup.height || 100;
      const maxDim = Math.max(currentWidth, currentHeight);
      const scale = maxDim > 0 ? targetSizePx / maxDim : 1;

      svgGroup.scale(scale);

      if (position) {
        svgGroup.set({
          left: position.x - (currentWidth * scale) / 2,
          top: position.y - (currentHeight * scale) / 2,
        });
      } else {
        const center = this.getArtboardCenter();
        svgGroup.set({
          left: center.x - (currentWidth * scale) / 2,
          top: center.y - (currentHeight * scale) / 2,
        });
      }

      svgGroup.set({
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
        transparentCorners: false,
      });

      // Preserve scientific provenance & licensing metadata
      if (meta) {
        (svgGroup as any).scientificMeta = meta;
      }

      this.canvas.add(svgGroup);
      this.canvas.setActiveObject(svgGroup);
      this.canvas.requestRenderAll();
      this.updateSelectedProperties();
      return svgGroup;
    } catch (err) {
      console.error('Failed to load vector SVG:', err);
      return null;
    }
  }

  /**
   * Load vector SVG from string and insert into canvas
   */
  public async addSvgFromString(
    svgString: string,
    position?: { x: number; y: number },
    meta?: any
  ): Promise<FabricObject | null> {
    try {
      const { objects, options } = await loadSVGFromString(svgString);
      if (!objects || objects.length === 0) return null;

      const validObjects = objects.filter((o): o is FabricObject => o !== null);
      if (validObjects.length === 0) return null;

      const svgGroup = util.groupSVGElements(validObjects, options);

      // Standardize size to approximately 50 mm (189 px)
      const targetSizePx = mmToPx(50);
      const currentWidth = svgGroup.width || 100;
      const currentHeight = svgGroup.height || 100;
      const maxDim = Math.max(currentWidth, currentHeight);
      const scale = maxDim > 0 ? targetSizePx / maxDim : 1;

      svgGroup.scale(scale);

      if (position) {
        svgGroup.set({
          left: position.x - (currentWidth * scale) / 2,
          top: position.y - (currentHeight * scale) / 2,
        });
      } else {
        const center = this.getArtboardCenter();
        svgGroup.set({
          left: center.x - (currentWidth * scale) / 2,
          top: center.y - (currentHeight * scale) / 2,
        });
      }

      svgGroup.set({
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
        transparentCorners: false,
      });

      if (meta) {
        (svgGroup as any).scientificMeta = meta;
      }

      this.canvas.add(svgGroup);
      this.canvas.setActiveObject(svgGroup);
      this.canvas.requestRenderAll();
      this.updateSelectedProperties();
      this.updateSelectionBounds();
      return svgGroup;
    } catch (err) {
      console.error('Failed to load SVG from string:', err);
      return null;
    }
  }

  /**
   * Load raster image (PNG/JPG/WEBP) from URL / dataURL and insert into canvas
   */
  public async addImageFromUrl(
    url: string,
    position?: { x: number; y: number }
  ): Promise<FabricImage | null> {
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      if (!img) return null;

      // Standardize size to fit artboard (e.g. max ~70mm)
      const targetSizePx = mmToPx(70);
      const currentWidth = img.width || 200;
      const currentHeight = img.height || 200;
      const maxDim = Math.max(currentWidth, currentHeight);
      const scale = maxDim > targetSizePx ? targetSizePx / maxDim : 1;

      img.scale(scale);

      if (position) {
        img.set({
          left: position.x - (currentWidth * scale) / 2,
          top: position.y - (currentHeight * scale) / 2,
        });
      } else {
        const center = this.getArtboardCenter();
        img.set({
          left: center.x - (currentWidth * scale) / 2,
          top: center.y - (currentHeight * scale) / 2,
        });
      }

      img.set({
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
        transparentCorners: false,
      });

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.requestRenderAll();
      this.updateSelectedProperties();
      this.updateSelectionBounds();
      return img;
    } catch (err) {
      console.error('Failed to load image:', err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // 8. PROPERTIES RECOLORING & STYLING
  // ---------------------------------------------------------------------------
  public replaceColorInSelection(oldHex: string, newHex: string): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    const changed = replaceColorInObject(active, oldHex, newHex);
    if (changed) {
      this.canvas.requestRenderAll();
      this.saveHistory();
      this.updateSelectedProperties();
      this.updateSelectionBounds();
    }
  }

  public setSelectionFill(color: string): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;

    if (active instanceof Group) {
      active.forEachObject((obj) => {
        if (obj.fill && obj.fill !== 'none') {
          obj.set('fill', color);
        }
      });
    } else {
      active.set('fill', color);
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setSelectionStroke(color: string, width?: number): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;

    if (active instanceof Group) {
      active.forEachObject((obj) => {
        if (obj.stroke && obj.stroke !== 'none') {
          obj.set('stroke', color);
          if (width !== undefined) obj.set('strokeWidth', width);
        }
      });
    } else {
      active.set('stroke', color);
      if (width !== undefined) active.set('strokeWidth', width);
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setSelectionOpacity(opacity: number): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('opacity', Math.min(Math.max(0, opacity), 1));
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
  }

  public deleteActiveObjects(): void {
    const activeObjects = this.canvas.getActiveObjects();
    if (!activeObjects || activeObjects.length === 0) return;

    const isEditingText = activeObjects.some((obj: any) => obj.isEditing);
    if (isEditingText) return;

    this.canvas.remove(...activeObjects);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
  }

  // ---------------------------------------------------------------------------
  // 9. PROCEDURAL GENERATORS (Membrane, DNA, Pathway Connectors)
  // ---------------------------------------------------------------------------
  public addMembrane(
    params?: Partial<MembraneParams>,
    position?: { x: number; y: number }
  ): Group {
    const group = createMembraneGroup(params);
    const pos = position || this.getArtboardCenter();
    group.set({
      left: pos.x - 140,
      top: pos.y - 30,
    });
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return group;
  }

  public addDna(
    params?: Partial<DnaParams>,
    position?: { x: number; y: number }
  ): Group {
    const group = createDnaGroup(params);
    const pos = position || this.getArtboardCenter();
    group.set({
      left: pos.x - 160,
      top: pos.y - 30,
    });
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return group;
  }

  public addActivationArrow(position?: { x: number; y: number }): Group {
    const group = createPathwayConnector({ type: 'activation' });
    const pos = position || this.getArtboardCenter();
    group.set({
      left: pos.x - 80,
      top: pos.y - 10,
    });
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return group;
  }

  public addInhibitionArrow(position?: { x: number; y: number }): Group {
    const group = createPathwayConnector({ type: 'inhibition' });
    const pos = position || this.getArtboardCenter();
    group.set({
      left: pos.x - 80,
      top: pos.y - 10,
    });
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return group;
  }

  public updateActiveBioParams(newParams: any): void {
    const active = this.canvas.getActiveObject() as any;
    if (!active || !active.bioType) return;

    const left = active.left;
    const top = active.top;
    const angle = active.angle;
    const scaleX = active.scaleX;
    const scaleY = active.scaleY;

    let newGroup: Group | null = null;
    if (active.bioType === 'membrane') {
      const merged = { ...active.membraneParams, ...newParams };
      newGroup = createMembraneGroup(merged);
    } else if (active.bioType === 'dna') {
      const merged = { ...active.dnaParams, ...newParams };
      newGroup = createDnaGroup(merged);
    } else if (active.bioType === 'arrow') {
      const merged = { ...active.arrowParams, ...newParams };
      newGroup = createPathwayConnector(merged);
    }

    if (newGroup) {
      newGroup.set({ left, top, angle, scaleX, scaleY });
      this.canvas.remove(active);
      this.canvas.add(newGroup);
      this.canvas.setActiveObject(newGroup);
      this.canvas.requestRenderAll();
      this.updateSelectedProperties();
      this.updateSelectionBounds();
    }
  }

  public async duplicateActiveObjects(): Promise<FabricObject | null> {
    const active = this.canvas.getActiveObject();
    if (!active) return null;

    const cloned = await active.clone([
      'scientificMeta',
      'bioType',
      'membraneParams',
      'dnaParams',
      'arrowParams',
    ]);

    const offsetPx = mmToPx(10);
    cloned.set({
      left: (cloned.left || 0) + offsetPx,
      top: (cloned.top || 0) + offsetPx,
      evented: true,
    });

    if (cloned.type === 'activeSelection' || (cloned as any)._objects) {
      (cloned as any).canvas = this.canvas;
      (cloned as any).forEachObject((obj: FabricObject) => {
        this.canvas.add(obj);
      });
      cloned.setCoords();
    } else {
      this.canvas.add(cloned);
    }

    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
    return cloned;
  }

  public bringForward(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.bringObjectForward(active);
      this.canvas.requestRenderAll();
    }
  }

  public sendBackward(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.sendObjectBackwards(active);
      this.canvas.requestRenderAll();
    }
  }

  public bringToFront(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.bringObjectToFront(active);
      this.canvas.requestRenderAll();
    }
  }

  public sendToBack(): void {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.sendObjectToBack(active);
      this.canvas.requestRenderAll();
    }
  }

  public getPageJSON(): any {
    return this.canvas.toObject([
      'scientificMeta',
      'bioType',
      'membraneParams',
      'dnaParams',
      'arrowParams',
    ]);
  }

  public async loadPageJSON(json?: any): Promise<void> {
    this.canvas.discardActiveObject();
    this.canvas.clear();
    this.canvas.backgroundColor = '';

    if (json && json.objects && json.objects.length > 0) {
      await this.canvas.loadFromJSON(json);
      this.canvas.backgroundColor = '';
    }
  }

  // ---------------------------------------------------------------------------
  // 10. HISTORY (UNDO / REDO ENGINE)
  // ---------------------------------------------------------------------------
  public saveHistory(): void {
    if (this.isHistoryLocked) return;
    try {
      const jsonStr = JSON.stringify(this.getPageJSON());
      if (this.historyIndex >= 0 && this.historyStack[this.historyIndex] === jsonStr) {
        return;
      }
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      }
      this.historyStack.push(jsonStr);
      if (this.historyStack.length > this.maxHistoryStates) {
        this.historyStack.shift();
      } else {
        this.historyIndex++;
      }
      this.notifyUndoRedoState();
    } catch (err) {
      console.error('Failed to snapshot canvas history:', err);
    }
  }

  private notifyUndoRedoState(): void {
    const canUndo = this.historyIndex > 0;
    const canRedo = this.historyIndex < this.historyStack.length - 1;
    this.options.onUndoRedoChange?.(canUndo, canRedo);
  }

  public async undo(): Promise<void> {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      await this.restoreHistoryState(this.historyStack[this.historyIndex]);
    }
  }

  public async redo(): Promise<void> {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      await this.restoreHistoryState(this.historyStack[this.historyIndex]);
    }
  }

  private async restoreHistoryState(jsonStr: string): Promise<void> {
    this.isHistoryLocked = true;
    try {
      await this.loadPageJSON(JSON.parse(jsonStr));
    } finally {
      this.isHistoryLocked = false;
      this.notifyUndoRedoState();
    }
  }

  // ---------------------------------------------------------------------------
  // 11. CLIPBOARD & SELECTION ACTIONS
  // ---------------------------------------------------------------------------
  public async copyActiveObjects(): Promise<void> {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    this.clipboard = await active.clone([
      'scientificMeta',
      'bioType',
      'membraneParams',
      'dnaParams',
      'arrowParams',
    ]);
  }

  public async pasteObjects(): Promise<FabricObject | null> {
    if (!this.clipboard) return null;
    const cloned = await this.clipboard.clone([
      'scientificMeta',
      'bioType',
      'membraneParams',
      'dnaParams',
      'arrowParams',
    ]);
    const offsetPx = mmToPx(5);
    cloned.set({
      left: (cloned.left || 0) + offsetPx,
      top: (cloned.top || 0) + offsetPx,
      evented: true,
    });
    if (cloned.type === 'activeSelection' || (cloned as any)._objects) {
      (cloned as any).canvas = this.canvas;
      (cloned as any).forEachObject((obj: FabricObject) => {
        this.canvas.add(obj);
      });
      cloned.setCoords();
    } else {
      this.canvas.add(cloned);
    }
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
    return cloned;
  }

  public selectAll(): void {
    const objects = this.canvas.getObjects().filter((obj) => !obj.excludeFromExport);
    if (objects.length === 0) return;
    this.canvas.discardActiveObject();
    const selection = new ActiveSelection(objects, { canvas: this.canvas });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  // ---------------------------------------------------------------------------
  // 12. GROUPING, LOCKING & FLIPPING
  // ---------------------------------------------------------------------------
  public groupActiveSelection(): Group | null {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof ActiveSelection)) return null;

    const objects = active.getObjects();
    this.canvas.discardActiveObject();
    this.canvas.remove(...objects);

    const group = new Group(objects, {
      cornerColor: '#0284C7',
      cornerStyle: 'circle',
      borderColor: '#0284C7',
      transparentCorners: false,
    });

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
    return group;
  }

  public ungroupActiveObject(): FabricObject[] | null {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Group) || active instanceof ActiveSelection) return null;

    const objects = active.removeAll();
    this.canvas.remove(active);
    this.canvas.add(...objects);

    const as = new ActiveSelection(objects, { canvas: this.canvas });
    this.canvas.setActiveObject(as);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
    return objects;
  }

  public toggleLockActiveObjects(): boolean {
    const active = this.canvas.getActiveObject();
    if (!active) return false;

    const isCurrentlyLocked =
      !!(active as any).isLocked || (active.lockMovementX && active.lockMovementY);
    const newLocked = !isCurrentlyLocked;

    active.set({
      lockMovementX: newLocked,
      lockMovementY: newLocked,
      lockRotation: newLocked,
      lockScalingX: newLocked,
      lockScalingY: newLocked,
      hasControls: !newLocked,
    });
    (active as any).isLocked = newLocked;

    this.canvas.requestRenderAll();
    this.updateSelectedProperties();
    return newLocked;
  }

  public toggleFlipX(): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('flipX', !active.flipX);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public toggleFlipY(): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('flipY', !active.flipY);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  // ---------------------------------------------------------------------------
  // 13. GEOMETRY & POSITIONING CONTROLS
  // ---------------------------------------------------------------------------
  public setSelectionX(x: number): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('left', x);
    active.setCoords();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  public setSelectionY(y: number): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('top', y);
    active.setCoords();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  public setSelectionWidth(width: number): void {
    const active = this.canvas.getActiveObject();
    if (!active || width <= 0) return;
    const currentW = active.width || 1;
    active.set('scaleX', width / currentW);
    active.setCoords();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  public setSelectionHeight(height: number): void {
    const active = this.canvas.getActiveObject();
    if (!active || height <= 0) return;
    const currentH = active.height || 1;
    active.set('scaleY', height / currentH);
    active.setCoords();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  public setSelectionAngle(angle: number): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('angle', ((angle % 360) + 360) % 360);
    active.setCoords();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  // ---------------------------------------------------------------------------
  // 14. ALIGNMENT & DISTRIBUTION ENGINE
  // ---------------------------------------------------------------------------
  public alignObjects(alignment: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom'): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;

    const { widthMm, heightMm } = getEffectiveDimensionsMm(this.docConfig);
    const artboardW = mmToPx(widthMm);
    const artboardH = mmToPx(heightMm);

    if (active instanceof ActiveSelection) {
      const objects = active.getObjects();
      this.canvas.discardActiveObject();

      const minLeft = Math.min(...objects.map((o) => o.left || 0));
      const maxRight = Math.max(...objects.map((o) => (o.left || 0) + o.getScaledWidth()));
      const minTop = Math.min(...objects.map((o) => o.top || 0));
      const maxBottom = Math.max(...objects.map((o) => (o.top || 0) + o.getScaledHeight()));
      const centerH = (minLeft + maxRight) / 2;
      const centerV = (minTop + maxBottom) / 2;

      objects.forEach((obj) => {
        switch (alignment) {
          case 'left':
            obj.set('left', minLeft);
            break;
          case 'centerH':
            obj.set('left', centerH - obj.getScaledWidth() / 2);
            break;
          case 'right':
            obj.set('left', maxRight - obj.getScaledWidth());
            break;
          case 'top':
            obj.set('top', minTop);
            break;
          case 'centerV':
            obj.set('top', centerV - obj.getScaledHeight() / 2);
            break;
          case 'bottom':
            obj.set('top', maxBottom - obj.getScaledHeight());
            break;
        }
        obj.setCoords();
      });

      const newSelection = new ActiveSelection(objects, { canvas: this.canvas });
      this.canvas.setActiveObject(newSelection);
    } else {
      const objW = active.getScaledWidth();
      const objH = active.getScaledHeight();
      switch (alignment) {
        case 'left':
          active.set('left', 0);
          break;
        case 'centerH':
          active.set('left', (artboardW - objW) / 2);
          break;
        case 'right':
          active.set('left', artboardW - objW);
          break;
        case 'top':
          active.set('top', 0);
          break;
        case 'centerV':
          active.set('top', (artboardH - objH) / 2);
          break;
        case 'bottom':
          active.set('top', artboardH - objH);
          break;
      }
      active.setCoords();
    }

    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  public distributeObjects(direction: 'horizontal' | 'vertical'): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof ActiveSelection)) return;

    const objects = active.getObjects();
    if (objects.length < 3) return;

    this.canvas.discardActiveObject();

    if (direction === 'horizontal') {
      objects.sort((a, b) => (a.left || 0) - (b.left || 0));
      const first = objects[0];
      const last = objects[objects.length - 1];
      const startX = first.left || 0;
      const endX = (last.left || 0) + last.getScaledWidth();
      const totalObjWidth = objects.reduce((sum, o) => sum + o.getScaledWidth(), 0);
      const totalGap = endX - startX - totalObjWidth;
      const gap = totalGap / (objects.length - 1);

      let currentX = startX;
      objects.forEach((obj) => {
        obj.set('left', currentX);
        obj.setCoords();
        currentX += obj.getScaledWidth() + gap;
      });
    } else {
      objects.sort((a, b) => (a.top || 0) - (b.top || 0));
      const first = objects[0];
      const last = objects[objects.length - 1];
      const startY = first.top || 0;
      const endY = (last.top || 0) + last.getScaledHeight();
      const totalObjHeight = objects.reduce((sum, o) => sum + o.getScaledHeight(), 0);
      const totalGap = endY - startY - totalObjHeight;
      const gap = totalGap / (objects.length - 1);

      let currentY = startY;
      objects.forEach((obj) => {
        obj.set('top', currentY);
        obj.setCoords();
        currentY += obj.getScaledHeight() + gap;
      });
    }

    const newSelection = new ActiveSelection(objects, { canvas: this.canvas });
    this.canvas.setActiveObject(newSelection);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
  }

  // ---------------------------------------------------------------------------
  // 15. RICH TYPOGRAPHY ENGINE
  // ---------------------------------------------------------------------------
  public setFontFamily(family: string): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    if (active instanceof Textbox) {
      active.set('fontFamily', family);
      active.initDimensions();
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setFontSize(size: number): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    if (active instanceof Textbox) {
      active.set('fontSize', Math.max(6, Math.min(160, size)));
      active.initDimensions();
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public toggleBold(): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    const isBold =
      active.fontWeight === 'bold' ||
      (typeof active.fontWeight === 'number' && active.fontWeight >= 700);
    active.set('fontWeight', isBold ? 'normal' : 'bold');
    active.initDimensions();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public toggleItalic(): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    const isItalic = active.fontStyle === 'italic';
    active.set('fontStyle', isItalic ? 'normal' : 'italic');
    active.initDimensions();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public toggleUnderline(): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    active.set('underline', !active.underline);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public toggleStrikethrough(): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    active.set('linethrough', !active.linethrough);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setTextAlign(align: 'left' | 'center' | 'right' | 'justify'): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    active.set('textAlign', align);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setTextBackgroundColor(color: string): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    active.set('textBackgroundColor', color);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setLineHeight(lineHeight: number): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    active.set('lineHeight', Math.max(0.5, Math.min(3, lineHeight)));
    active.initDimensions();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setCharSpacing(charSpacing: number): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    active.set('charSpacing', charSpacing);
    active.initDimensions();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public changeTextCase(mode: 'uppercase' | 'lowercase' | 'titlecase'): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    const current = active.text || '';
    let updated = current;
    if (mode === 'uppercase') updated = current.toUpperCase();
    else if (mode === 'lowercase') updated = current.toLowerCase();
    else if (mode === 'titlecase') updated = current.replace(/\b\w/g, (c) => c.toUpperCase());
    active.set('text', updated);
    active.initDimensions();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public insertTextAtCursor(chars: string): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof Textbox)) return;
    const text = active.text || '';
    const start = active.selectionStart !== undefined ? active.selectionStart : text.length;
    const end = active.selectionEnd !== undefined ? active.selectionEnd : text.length;
    const before = text.substring(0, start);
    const after = text.substring(end);
    active.set('text', before + chars + after);
    active.set({
      selectionStart: start + chars.length,
      selectionEnd: start + chars.length,
    });
    active.initDimensions();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  // ---------------------------------------------------------------------------
  // 16. STROKE STYLING, CORNER RADIUS & SHADOWS
  // ---------------------------------------------------------------------------
  public setStrokeDashStyle(style: 'solid' | 'dashed' | 'dotted' | 'dash-dot'): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    let dash: number[] | null = null;
    if (style === 'dashed') dash = [8, 6];
    else if (style === 'dotted') dash = [3, 4];
    else if (style === 'dash-dot') dash = [10, 4, 2, 4];

    if (active instanceof Group) {
      active.forEachObject((o) => o.set('strokeDashArray', dash));
    } else {
      active.set('strokeDashArray', dash);
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setStrokeLineJoin(join: 'miter' | 'round' | 'bevel'): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('strokeLineJoin', join);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setStrokeLineCap(cap: 'butt' | 'round' | 'square'): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('strokeLineCap', cap);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setCornerRadius(radius: number): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    if (active instanceof Rect) {
      active.set({ rx: radius, ry: radius });
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  public setDropShadow(
    enabled: boolean,
    options?: { color?: string; blur?: number; offsetX?: number; offsetY?: number }
  ): void {
    const active = this.canvas.getActiveObject();
    if (!active) return;

    if (!enabled) {
      active.set('shadow', null);
    } else {
      const color = options?.color || 'rgba(0, 0, 0, 0.25)';
      const blur = options?.blur !== undefined ? options.blur : 15;
      const offsetX = options?.offsetX !== undefined ? options.offsetX : 4;
      const offsetY = options?.offsetY !== undefined ? options.offsetY : 6;
      active.set('shadow', new Shadow({ color, blur, offsetX, offsetY }));
    }
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  // ---------------------------------------------------------------------------
  // 17. IMAGE FILTERS ENGINE
  // ---------------------------------------------------------------------------
  public applyImageFilter(
    filterType: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale' | 'invert',
    value: number | boolean
  ): void {
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof FabricImage)) return;

    const img = active as FabricImage;
    img.filters = img.filters || [];

    // Remove existing filter of same type
    img.filters = img.filters.filter((f: any) => {
      const t = f?.type?.toLowerCase();
      return t !== filterType.toLowerCase();
    });

    if (filterType === 'brightness' && typeof value === 'number' && value !== 0) {
      img.filters.push(new filters.Brightness({ brightness: value }));
    } else if (filterType === 'contrast' && typeof value === 'number' && value !== 0) {
      img.filters.push(new filters.Contrast({ contrast: value }));
    } else if (filterType === 'saturation' && typeof value === 'number' && value !== 0) {
      img.filters.push(new filters.Saturation({ saturation: value }));
    } else if (filterType === 'blur' && typeof value === 'number' && value > 0) {
      img.filters.push(new filters.Blur({ blur: value }));
    } else if (filterType === 'grayscale' && value === true) {
      img.filters.push(new filters.Grayscale());
    } else if (filterType === 'invert' && value === true) {
      img.filters.push(new filters.Invert());
    }

    img.applyFilters();
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
  }

  // ---------------------------------------------------------------------------
  // 18. PROCEDURAL SHAPES INSERTION
  // ---------------------------------------------------------------------------
  public addProceduralShape(
    shapeId: string,
    position?: { x: number; y: number }
  ): FabricObject | null {
    const shapeDef = SHAPE_CATALOG.find((s) => s.id === shapeId);
    if (!shapeDef) return null;

    const obj = shapeDef.create();
    const pos = position || this.getArtboardCenter();
    const w = obj.width || 100;
    const h = obj.height || 100;

    obj.set({
      left: pos.x - w / 2,
      top: pos.y - h / 2,
    });

    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();
    this.saveHistory();
    this.updateSelectedProperties();
    this.updateSelectionBounds();
    return obj;
  }

  // ---------------------------------------------------------------------------
  // 19. ARTBOARD BACKGROUND
  // ---------------------------------------------------------------------------
  public setArtboardBackgroundColor(color: string): void {
    this.docConfig.backgroundColor = color;
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  public dispose(): void {
    this.canvas.dispose();
  }
}
