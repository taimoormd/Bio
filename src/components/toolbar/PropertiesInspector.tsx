import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Group as GroupIcon,
  Ungroup as UngroupIcon,
  ChevronDown,
  Sun,
  Contrast,
  Sparkles,
  Droplet,
  SlidersHorizontal,
  Sliders,
  Eye,
  Layers,
  Dna,
  ArrowRight,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import {
  PRESET_DEFINITIONS,
  ARTBOARD_BACKGROUND_PRESETS,
  getEffectiveDimensionsMm,
} from '../../core/document/types';
import { Tooltip } from '../ui/Tooltip';
import { PositionPopover } from './popovers/PositionPopover';
import { BorderPopover } from './popovers/BorderPopover';

export interface PropertiesInspectorProps {
  // Universal Actions
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onFlipX: () => void;
  onFlipY: () => void;
  onToggleLock: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onAlign: (alignment: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;

  // Geometry
  onSetX: (x: number) => void;
  onSetY: (y: number) => void;
  onSetWidth: (w: number) => void;
  onSetHeight: (h: number) => void;
  onSetAngle: (angle: number) => void;
  onSetOpacity: (opacity: number) => void;

  // Shape / Vector Styling
  onSetFill: (color: string) => void;
  onSetStroke: (color: string, width?: number) => void;
  onSetStrokeDashStyle: (style: 'solid' | 'dashed' | 'dotted' | 'dash-dot') => void;
  onSetCornerRadius: (radius: number) => void;
  onSetDropShadow: (enabled: boolean, options?: any) => void;
  onReplaceColor?: (oldHex: string, newHex: string) => void;

  // Typography
  onSetFontFamily: (family: string) => void;
  onSetFontSize: (size: number) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onToggleStrikethrough: () => void;
  onSetTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onSetTextBackgroundColor: (color: string) => void;
  onSetLineHeight: (val: number) => void;
  onSetCharSpacing: (val: number) => void;
  onChangeTextCase: (mode: 'uppercase' | 'lowercase' | 'titlecase') => void;
  onInsertTextAtCursor: (chars: string) => void;

  // Image Filters
  onApplyImageFilter: (
    filterType: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale' | 'invert',
    value: number | boolean
  ) => void;

  // Artboard
  onSetArtboardBackgroundColor: (color: string) => void;
}

const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Merriweather',
  'JetBrains Mono',
  'Courier New',
];

const GREEK_LETTERS = [
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ',
  'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
  'Δ', 'Σ', 'Ω', 'Λ', 'Φ', 'Ψ', 'Γ', 'Θ',
];

const SCI_SYMBOLS = [
  '±', '≈', '≠', '≤', '≥', '°', '×', '÷', '·', 'µ',
  '→', '⇌', '←', '↑', '↓', '↔', '⇒', '⇐', '⇔',
  'µg', 'µL', 'mM', 'nM', 'Å', '℃', '∞',
];

const SUPERSCRIPTS = [
  '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁺', '⁻', '⁽', '⁾', 'ⁿ',
];

const SUBSCRIPTS = [
  '₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₊', '₋', '₍', '₎',
];

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = (props) => {
  const {
    documentConfig,
    showMargins,
    showColumns,
    toggleMargins,
    toggleColumns,
    selectedObjectCount,
    selectedObjectProps,
    canUndo,
    canRedo,
    isPropertiesPanelOpen,
    togglePropertiesPanel,
    openColorPanel,
  } = useEditorStore();

  const [isGreekMenuOpen, setIsGreekMenuOpen] = useState(false);
  const [isImageFiltersOpen, setIsImageFiltersOpen] = useState(false);

  const greekMenuRef = useRef<HTMLDivElement>(null);
  const imageFiltersRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (greekMenuRef.current && !greekMenuRef.current.contains(target)) {
        setIsGreekMenuOpen(false);
      }
      if (imageFiltersRef.current && !imageFiltersRef.current.contains(target)) {
        setIsImageFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSelection = selectedObjectCount > 0 && selectedObjectProps !== null;
  const isTextbox = hasSelection && (selectedObjectProps.type === 'textbox' || !!selectedObjectProps.text);
  const isImage = hasSelection && (selectedObjectProps.type === 'image' || selectedObjectProps.type === 'FabricImage');
  const isGroup = hasSelection && selectedObjectProps.type === 'group';
  const isRect = hasSelection && selectedObjectProps.type === 'rect';
  const hasBioParams = hasSelection && !!(selectedObjectProps.bioType || selectedObjectProps.scientificMeta);

  // ---------------------------------------------------------------------------
  // 1. ARTBOARD MODE (No objects selected)
  // ---------------------------------------------------------------------------
  if (!hasSelection) {
    const presetName =
      documentConfig.preset !== 'Custom'
        ? PRESET_DEFINITIONS[documentConfig.preset]?.name
        : 'Custom Format';
    const { widthMm, heightMm } = getEffectiveDimensionsMm(documentConfig);
    const currentColor = documentConfig.backgroundColor || '#FFFFFF';

    return (
      <header className="h-11 w-full bg-white border-b border-slate-200/80 px-4 flex items-center justify-between text-xs text-slate-700 select-none shadow-xs z-10 shrink-0">
        <div className="flex items-center space-x-3">
          {/* Document Dimensions Tag */}
          <div className="flex items-center space-x-2 text-slate-600">
            <span className="font-semibold text-slate-800">{presetName}</span>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
              {Math.round(widthMm)} × {Math.round(heightMm)} mm
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Artboard Background Color Swatches */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Background:</span>
            {ARTBOARD_BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.color}
                onClick={() => props.onSetArtboardBackgroundColor(preset.color)}
                title={preset.name}
                className={`w-5 h-5 rounded-full border transition-all ${
                  preset.border
                } ${
                  currentColor.toLowerCase() === preset.color.toLowerCase()
                    ? 'ring-2 ring-sky-500 ring-offset-1 scale-110 shadow-xs'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: preset.color }}
              />
            ))}
            {/* Custom Background Color Picker */}
            <label
              title="Custom artboard color"
              className="relative w-5 h-5 rounded-full border border-slate-300 cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-sky-400 via-rose-300 to-amber-200 hover:scale-105 transition-transform"
            >
              <input
                type="color"
                value={currentColor}
                onChange={(e) => props.onSetArtboardBackgroundColor(e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Guidelines Toggles */}
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleMargins}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                showMargins
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Margins
            </button>
            <button
              onClick={toggleColumns}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                showColumns
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Columns
            </button>
          </div>
        </div>

        {/* Undo / Redo Controls */}
        <div className="flex items-center space-x-1">
          <Tooltip content="Undo" shortcut="Ctrl+Z">
            <button
              onClick={props.onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg transition-all ${
                canUndo
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Redo" shortcut="Ctrl+Y">
            <button
              onClick={props.onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg transition-all ${
                canRedo
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </header>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. CONTEXTUAL OBJECT MODE (Item(s) selected)
  // ---------------------------------------------------------------------------
  const typeLabel =
    selectedObjectCount > 1
      ? `${selectedObjectCount} Objects`
      : isTextbox
      ? 'Text'
      : isImage
      ? 'Image'
      : isGroup
      ? 'Group'
      : selectedObjectProps.type.charAt(0).toUpperCase() +
        selectedObjectProps.type.slice(1);

  return (
    <header className="h-11 w-full bg-white border-b border-slate-200/80 px-4 flex items-center justify-between text-xs text-slate-700 select-none shadow-xs z-10 shrink-0 overflow-x-auto">
      {/* Left side: Selection Type, Styling Controls, Position Popover */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Type Badge */}
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
          {typeLabel}
        </span>

        {/* Position & Align Popover (Eliminates raw coordinate dump) */}
        <PositionPopover
          left={selectedObjectProps.left}
          top={selectedObjectProps.top}
          width={selectedObjectProps.width}
          height={selectedObjectProps.height}
          angle={selectedObjectProps.angle}
          selectedCount={selectedObjectCount}
          onSetX={props.onSetX}
          onSetY={props.onSetY}
          onSetWidth={props.onSetWidth}
          onSetHeight={props.onSetHeight}
          onSetAngle={props.onSetAngle}
          onAlign={props.onAlign}
          onDistribute={props.onDistribute}
          onBringForward={props.onBringForward}
          onSendBackward={props.onSendBackward}
          onBringToFront={props.onBringToFront}
          onSendToBack={props.onSendToBack}
          onFlipX={props.onFlipX}
          onFlipY={props.onFlipY}
        />

        <div className="h-4 w-px bg-slate-200" />

        {/* ------------------ TEXTBOX TYPOGRAPHY BAR ------------------ */}
        {isTextbox && (
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Font Family Dropdown */}
            <select
              value={selectedObjectProps.fontFamily || 'Inter'}
              onChange={(e) => props.onSetFontFamily(e.target.value)}
              className="h-7 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>

            {/* Font Size Stepper */}
            <div className="flex items-center space-x-0.5 bg-slate-50 border border-slate-200 rounded-md px-1 h-7">
              <button
                type="button"
                onClick={() =>
                  props.onSetFontSize(Math.max(6, (selectedObjectProps.fontSize || 16) - 2))
                }
                className="px-1 text-slate-500 hover:text-slate-900 font-bold"
              >
                -
              </button>
              <input
                type="number"
                value={Math.round(selectedObjectProps.fontSize || 16)}
                onChange={(e) => props.onSetFontSize(Number(e.target.value))}
                className="w-7 text-center bg-transparent text-slate-700 focus:outline-hidden font-mono text-[11px] tabular-nums"
              />
              <button
                type="button"
                onClick={() =>
                  props.onSetFontSize(Math.min(160, (selectedObjectProps.fontSize || 16) + 2))
                }
                className="px-1 text-slate-500 hover:text-slate-900 font-bold"
              >
                +
              </button>
            </div>

            {/* Bold, Italic, Underline, Strike */}
            <div className="flex items-center space-x-0.5 bg-slate-50 border border-slate-200 rounded-md p-0.5 h-7">
              <Tooltip content="Bold" shortcut="Ctrl+B">
                <button
                  type="button"
                  onClick={props.onToggleBold}
                  className={`p-1 rounded ${
                    selectedObjectProps.fontWeight === 'bold' ||
                    (typeof selectedObjectProps.fontWeight === 'number' &&
                      selectedObjectProps.fontWeight >= 700)
                      ? 'bg-sky-100 text-sky-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Italic" shortcut="Ctrl+I">
                <button
                  type="button"
                  onClick={props.onToggleItalic}
                  className={`p-1 rounded ${
                    selectedObjectProps.fontStyle === 'italic'
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Underline" shortcut="Ctrl+U">
                <button
                  type="button"
                  onClick={props.onToggleUnderline}
                  className={`p-1 rounded ${
                    selectedObjectProps.underline
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Strikethrough">
                <button
                  type="button"
                  onClick={props.onToggleStrikethrough}
                  className={`p-1 rounded ${
                    selectedObjectProps.linethrough
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>

            {/* Text Color Swatch Trigger → opens left Color Panel */}
            <Tooltip content="Text Color">
              <button
                type="button"
                onClick={() => openColorPanel('textColor')}
                className="w-7 h-7 rounded-lg border border-slate-300/90 shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                style={{ backgroundColor: selectedObjectProps.fill || '#000000' }}
              >
                <span
                  className="font-bold text-xs drop-shadow-xs"
                  style={{
                    color:
                      selectedObjectProps.fill && selectedObjectProps.fill !== '#000000'
                        ? '#FFFFFF'
                        : '#FFFFFF',
                  }}
                >
                  A
                </span>
              </button>
            </Tooltip>

            {/* Text Highlight Swatch Trigger → opens left Color Panel */}
            <Tooltip content="Text Highlight">
              <button
                type="button"
                onClick={() => openColorPanel('textHighlight')}
                className={`w-7 h-7 rounded-lg border shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden relative ${
                  !selectedObjectProps.textBackgroundColor || selectedObjectProps.textBackgroundColor === 'transparent'
                    ? 'border-slate-300/90 bg-white'
                    : 'border-slate-300/90'
                }`}
                style={{
                  backgroundColor:
                    selectedObjectProps.textBackgroundColor && selectedObjectProps.textBackgroundColor !== 'transparent'
                      ? selectedObjectProps.textBackgroundColor
                      : '#FFFFFF',
                }}
              >
                {(!selectedObjectProps.textBackgroundColor || selectedObjectProps.textBackgroundColor === 'transparent') && (
                  <div className="absolute w-[120%] h-[1.5px] bg-rose-500 rotate-45" />
                )}
                <span className="text-[10px] font-semibold text-slate-700 relative z-10">ab</span>
              </button>
            </Tooltip>

            {/* Text Alignment */}
            <div className="flex items-center space-x-0.5 bg-slate-50 border border-slate-200 rounded-md p-0.5 h-7">
              <Tooltip content="Align Left">
                <button
                  type="button"
                  onClick={() => props.onSetTextAlign('left')}
                  className={`p-1 rounded ${
                    (selectedObjectProps.textAlign || 'left') === 'left'
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Align Center">
                <button
                  type="button"
                  onClick={() => props.onSetTextAlign('center')}
                  className={`p-1 rounded ${
                    selectedObjectProps.textAlign === 'center'
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Align Right">
                <button
                  type="button"
                  onClick={() => props.onSetTextAlign('right')}
                  className={`p-1 rounded ${
                    selectedObjectProps.textAlign === 'right'
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Justify">
                <button
                  type="button"
                  onClick={() => props.onSetTextAlign('justify')}
                  className={`p-1 rounded ${
                    selectedObjectProps.textAlign === 'justify'
                      ? 'bg-sky-100 text-sky-800'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>

            {/* Greek Letters & Notation Popover */}
            <div className="relative" ref={greekMenuRef}>
              <Tooltip content="Greek Letters & Scientific Notation">
                <button
                  type="button"
                  onClick={() => setIsGreekMenuOpen(!isGreekMenuOpen)}
                  className={`h-7 px-2 rounded-md font-serif text-xs font-semibold flex items-center space-x-1 border transition-all ${
                    isGreekMenuOpen
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>αβγ</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </Tooltip>

              {isGreekMenuOpen && (
                <div className="absolute top-8 left-0 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 animate-popover">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Greek Letters
                  </div>
                  <div className="grid grid-cols-8 gap-1 mb-2 font-serif text-sm">
                    {GREEK_LETTERS.map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => props.onInsertTextAtCursor(char)}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-sky-100 hover:text-sky-800 text-slate-700"
                      >
                        {char}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Scientific Symbols & Units
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2 font-mono text-xs">
                    {SCI_SYMBOLS.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => props.onInsertTextAtCursor(sym)}
                        className="h-6 w-7 flex items-center justify-center rounded hover:bg-sky-100 hover:text-sky-800 text-slate-700 text-[11px]"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
                        Superscript
                      </div>
                      <div className="flex flex-wrap gap-0.5 w-28">
                        {SUPERSCRIPTS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => props.onInsertTextAtCursor(c)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-sky-100 text-slate-700"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
                        Subscript
                      </div>
                      <div className="flex flex-wrap gap-0.5 w-28">
                        {SUBSCRIPTS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => props.onInsertTextAtCursor(c)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-sky-100 text-slate-700"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Case Changer */}
            <div className="flex items-center space-x-0.5 bg-slate-50 border border-slate-200 rounded-md p-0.5 h-7">
              <button
                type="button"
                onClick={() => props.onChangeTextCase('uppercase')}
                title="UPPERCASE"
                className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200 rounded"
              >
                AA
              </button>
              <button
                type="button"
                onClick={() => props.onChangeTextCase('lowercase')}
                title="lowercase"
                className="px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200 rounded"
              >
                aa
              </button>
              <button
                type="button"
                onClick={() => props.onChangeTextCase('titlecase')}
                title="Title Case"
                className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 rounded"
              >
                Aa
              </button>
            </div>
          </div>
        )}

        {/* ------------------ SHAPE / VECTOR FORMATTING BAR ------------------ */}
        {!isTextbox && !isImage && (
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Fill Color Swatch Trigger → opens left Color Panel */}
            <Tooltip content="Fill Color">
              <button
                type="button"
                onClick={() => openColorPanel('fill')}
                className={`w-7 h-7 rounded-lg border shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden relative ${
                  !selectedObjectProps.fill || selectedObjectProps.fill === 'transparent'
                    ? 'border-slate-300/90 bg-white'
                    : 'border-slate-300/90'
                }`}
                style={{
                  backgroundColor:
                    selectedObjectProps.fill && selectedObjectProps.fill !== 'transparent'
                      ? selectedObjectProps.fill
                      : '#FFFFFF',
                }}
              >
                {(!selectedObjectProps.fill || selectedObjectProps.fill === 'transparent') && (
                  <div className="absolute w-[120%] h-[1.5px] bg-rose-500 rotate-45" />
                )}
              </button>
            </Tooltip>

            {/* Canva-Style Border & Corners Popover */}
            <BorderPopover
              stroke={selectedObjectProps.stroke || '#0284C7'}
              strokeWidth={selectedObjectProps.strokeWidth || 0}
              strokeDashArray={selectedObjectProps.strokeDashArray}
              rx={selectedObjectProps.rx || 0}
              supportsCornerRadius={isRect}
              onSetStroke={(color, width) => props.onSetStroke(color, width)}
              onSetStrokeDashStyle={(style) => {
                if (style === 'none') {
                  props.onSetStroke(selectedObjectProps.stroke || '#0284C7', 0);
                } else {
                  props.onSetStrokeDashStyle(style);
                }
              }}
              onSetCornerRadius={(radius) => props.onSetCornerRadius(radius)}
            />

            {/* Stroke Color Swatch Trigger (Active when border width > 0) */}
            {(selectedObjectProps.strokeWidth || 0) > 0 && (
              <Tooltip content="Border Color">
                <button
                  type="button"
                  onClick={() => openColorPanel('stroke')}
                  className="w-7 h-7 rounded-lg border border-slate-300/90 shadow-2xs hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: selectedObjectProps.stroke || '#0284C7' }}
                />
              </Tooltip>
            )}

            {/* Drop Shadow Toggle */}
            <Tooltip content="Toggle Drop Shadow">
              <button
                type="button"
                onClick={() => props.onSetDropShadow(!selectedObjectProps.hasShadow)}
                className={`h-7 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedObjectProps.hasShadow
                    ? 'bg-sky-100 text-sky-800 border-sky-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Shadow
              </button>
            </Tooltip>
          </div>
        )}

        {/* ------------------ IMAGE ADJUSTMENTS / FILTERS BAR ------------------ */}
        {isImage && (
          <div className="flex items-center space-x-1.5 shrink-0" ref={imageFiltersRef}>
            <button
              type="button"
              onClick={() => setIsImageFiltersOpen(!isImageFiltersOpen)}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition-all ${
                isImageFiltersOpen
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Image Adjustments</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isImageFiltersOpen && (
              <div className="absolute top-12 left-64 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 animate-popover space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-800 text-xs">Image Adjustments</span>
                  <span className="text-[10px] text-slate-400">Non-destructive</span>
                </div>

                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-500" /> Brightness
                    </span>
                    <span className="font-mono text-[10px]">
                      {Math.round((selectedObjectProps.brightness || 0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={selectedObjectProps.brightness || 0}
                    onChange={(e) =>
                      props.onApplyImageFilter('brightness', parseFloat(e.target.value))
                    }
                    className="w-full accent-sky-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Contrast className="w-3 h-3 text-slate-600" /> Contrast
                    </span>
                    <span className="font-mono text-[10px]">
                      {Math.round((selectedObjectProps.contrast || 0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={selectedObjectProps.contrast || 0}
                    onChange={(e) =>
                      props.onApplyImageFilter('contrast', parseFloat(e.target.value))
                    }
                    className="w-full accent-sky-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" /> Saturation
                    </span>
                    <span className="font-mono text-[10px]">
                      {Math.round((selectedObjectProps.saturation || 0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={selectedObjectProps.saturation || 0}
                    onChange={(e) =>
                      props.onApplyImageFilter('saturation', parseFloat(e.target.value))
                    }
                    className="w-full accent-sky-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Blur */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-sky-500" /> Blur
                    </span>
                    <span className="font-mono text-[10px]">
                      {Math.round((selectedObjectProps.blur || 0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObjectProps.blur || 0}
                    onChange={(e) =>
                      props.onApplyImageFilter('blur', parseFloat(e.target.value))
                    }
                    className="w-full accent-sky-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Grayscale & Invert Toggles */}
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      props.onApplyImageFilter('grayscale', !selectedObjectProps.grayscale)
                    }
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-all ${
                      selectedObjectProps.grayscale
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Grayscale
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      props.onApplyImageFilter('invert', !selectedObjectProps.invert)
                    }
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-all ${
                      selectedObjectProps.invert
                        ? 'bg-sky-100 text-sky-800 border-sky-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Invert
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Opacity, Bio Parameters Toggle, Group, Lock, Undo/Redo */}
      <div className="flex items-center space-x-1.5 shrink-0">
        {/* Opacity Stepper */}
        <Tooltip content="Object Opacity">
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 h-7">
            <Eye className="w-3 h-3 text-slate-400" />
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={Math.round((selectedObjectProps.opacity ?? 1) * 100)}
              onChange={(e) => props.onSetOpacity(Number(e.target.value) / 100)}
              className="w-7 bg-transparent text-slate-700 focus:outline-hidden text-right font-mono text-[11px] tabular-nums"
            />
            <span className="text-slate-400 text-[10px]">%</span>
          </div>
        </Tooltip>

        {/* Collapsible Right Sidebar Toggle Button */}
        {hasBioParams ? (
          <Tooltip content="Toggle Bio Parameters Sidebar">
            <button
              type="button"
              onClick={togglePropertiesPanel}
              className={`h-7 px-2.5 rounded-lg flex items-center space-x-1.5 border text-xs font-medium transition-all ${
                isPropertiesPanelOpen
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {selectedObjectProps.bioType === 'membrane' ? (
                <Layers className="w-3.5 h-3.5 text-amber-600" />
              ) : selectedObjectProps.bioType === 'dna' ? (
                <Dna className="w-3.5 h-3.5 text-sky-600" />
              ) : selectedObjectProps.bioType === 'arrow' ? (
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Bio Parameters</span>
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Toggle Properties Panel">
            <button
              type="button"
              onClick={togglePropertiesPanel}
              className={`p-1.5 rounded-lg border transition-all ${
                isPropertiesPanelOpen
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}

        <div className="h-4 w-px bg-slate-200" />

        {/* Group / Ungroup */}
        {selectedObjectCount > 1 ? (
          <Tooltip content="Group Objects" shortcut="Ctrl+G">
            <button
              type="button"
              onClick={props.onGroup}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <GroupIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        ) : isGroup ? (
          <Tooltip content="Ungroup Objects" shortcut="Ctrl+Shift+G">
            <button
              type="button"
              onClick={props.onUngroup}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <UngroupIcon className="w-4 h-4" />
            </button>
          </Tooltip>
        ) : null}

        {/* Lock / Unlock */}
        <Tooltip content={selectedObjectProps.isLocked ? 'Unlock Object' : 'Lock Object'}>
          <button
            type="button"
            onClick={props.onToggleLock}
            className={`p-1.5 rounded-lg transition-all ${
              selectedObjectProps.isLocked
                ? 'bg-amber-100 text-amber-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {selectedObjectProps.isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>
        </Tooltip>

        {/* Duplicate */}
        <Tooltip content="Duplicate" shortcut="Ctrl+D">
          <button
            type="button"
            onClick={props.onDuplicate}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <Copy className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Delete */}
        <Tooltip content="Delete Object" shortcut="Del">
          <button
            type="button"
            onClick={props.onDelete}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="h-4 w-px bg-slate-200" />

        {/* Undo / Redo */}
        <Tooltip content="Undo" shortcut="Ctrl+Z">
          <button
            type="button"
            onClick={props.onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-all ${
              canUndo
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="Redo" shortcut="Ctrl+Y">
          <button
            type="button"
            onClick={props.onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-all ${
              canRedo
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
