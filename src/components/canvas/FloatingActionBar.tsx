import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  FolderPlus,
  FolderMinus,
} from 'lucide-react';
import type { SelectionBounds } from '../../core/canvas/CanvasEngine';
import { Tooltip } from '../ui/Tooltip';
import { BorderPopover } from '../toolbar/popovers/BorderPopover';
import { CompactColorPopover } from '../toolbar/popovers/CompactColorPopover';
import { useEditorStore } from '../../stores/useEditorStore';

export interface FloatingActionBarProps {
  bounds: SelectionBounds | null;
  isLocked?: boolean;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
  // Shape/vector actions
  onSetFill?: (color: string) => void;
  onSetStroke?: (color: string, width?: number) => void;
  onSetStrokeDashStyle?: (style: 'solid' | 'dashed' | 'dotted' | 'none') => void;
  onSetCornerRadius?: (radius: number) => void;
  onSetDropShadow?: (enabled: boolean) => void;
  onSetOpacity?: (opacity: number) => void;
  onRecolorSlot?: (slotId: string, newHex: string) => void;
  onHoverSlot?: (slotId: string | null) => void;
  onReplaceColor?: (oldHex: string, newHex: string) => void;
  // Text actions
  onSetFontSize?: (size: number) => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onSetTextAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onSetTextBackgroundColor?: (color: string) => void;
  // Group actions
  onGroup?: () => void;
  onUngroup?: () => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  bounds,
  isLocked = false,
  onDuplicate,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onDelete,
  onSetFill,
  onSetStroke,
  onSetStrokeDashStyle,
  onSetCornerRadius,
  onSetDropShadow,
  onSetOpacity,
  onRecolorSlot,
  onHoverSlot,
  onReplaceColor,
  onSetFontSize,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSetTextAlign,
  onSetTextBackgroundColor,
  onGroup,
  onUngroup,
}) => {
  const { selectedObjectProps, selectedObjectCount, documentColors } = useEditorStore();
  const [isOpacityOpen, setIsOpacityOpen] = useState(false);
  const opacityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpacityOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (opacityRef.current && !opacityRef.current.contains(e.target as Node)) {
        setIsOpacityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpacityOpen]);

  if (!bounds || bounds.width <= 0 || bounds.height <= 0 || !selectedObjectProps) {
    return null;
  }

  const toolbarHeight = 40;
  const gap = 12;
  // Position cleanly above selection, or flip below if too close to the top edge
  const showAbove = bounds.top - toolbarHeight - gap >= 12;
  const top = showAbove
    ? bounds.top - toolbarHeight - gap
    : bounds.top + bounds.height + gap;
  const left = bounds.left + bounds.width / 2;

  const isTextbox = selectedObjectProps.type === 'textbox' || !!selectedObjectProps.text;
  const isImage = selectedObjectProps.type === 'image' || selectedObjectProps.type === 'FabricImage';
  const isGroup = selectedObjectProps.type === 'group';
  const isRect = selectedObjectProps.type === 'rect';

  return (
    <div
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
      }}
      className="absolute z-30 flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-xl px-1.5 py-1 space-x-1 select-none pointer-events-auto transition-all duration-100 ease-out animate-floating-pill"
    >
      {/* ---------------- 1. MULTI-SELECTION / GROUP CONTROLS ---------------- */}
      {selectedObjectCount > 1 && onGroup && (
        <Tooltip content="Group Objects" shortcut="Ctrl+G" side="top">
          <button
            type="button"
            onClick={onGroup}
            className="h-6 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center space-x-1 active:scale-95 transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Group</span>
          </button>
        </Tooltip>
      )}

      {isGroup && onUngroup && (
        <Tooltip content="Ungroup Objects" shortcut="Ctrl+Shift+G" side="top">
          <button
            type="button"
            onClick={onUngroup}
            className="h-6 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center space-x-1 active:scale-95 transition-all"
          >
            <FolderMinus className="w-3.5 h-3.5" />
            <span>Ungroup</span>
          </button>
        </Tooltip>
      )}

      {/* ---------------- 2. TEXT CONTROLS ---------------- */}
      {isTextbox && (
        <div className="flex items-center space-x-1">
          {/* Font Size Stepper */}
          <div className="flex items-center space-x-0.5 bg-slate-100/80 border border-slate-200/80 rounded-md p-0.5 h-6">
            <button
              type="button"
              onClick={() => onSetFontSize?.(Math.max(6, (selectedObjectProps.fontSize || 16) - 2))}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold text-xs"
            >
              -
            </button>
            <span className="w-6 text-center text-slate-700 font-mono text-[11px] tabular-nums">
              {Math.round(selectedObjectProps.fontSize || 16)}
            </span>
            <button
              type="button"
              onClick={() => onSetFontSize?.(Math.min(160, (selectedObjectProps.fontSize || 16) + 2))}
              className="px-1 text-slate-500 hover:text-slate-900 font-bold text-xs"
            >
              +
            </button>
          </div>

          {/* Bold, Italic, Underline */}
          <div className="flex items-center space-x-0.5 bg-slate-100/80 border border-slate-200/80 rounded-md p-0.5 h-6">
            {onToggleBold && (
              <button
                type="button"
                onClick={onToggleBold}
                className={`p-1 rounded ${
                  selectedObjectProps.fontWeight === 'bold' ||
                  (typeof selectedObjectProps.fontWeight === 'number' && selectedObjectProps.fontWeight >= 700)
                    ? 'bg-sky-100 text-sky-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Bold className="w-3 h-3" />
              </button>
            )}
            {onToggleItalic && (
              <button
                type="button"
                onClick={onToggleItalic}
                className={`p-1 rounded ${
                  selectedObjectProps.fontStyle === 'italic'
                    ? 'bg-sky-100 text-sky-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Italic className="w-3 h-3" />
              </button>
            )}
            {onToggleUnderline && (
              <button
                type="button"
                onClick={onToggleUnderline}
                className={`p-1 rounded ${
                  selectedObjectProps.underline ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Underline className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Text Color Swatch Trigger */}
          {onSetFill && (
            <CompactColorPopover
              currentColor={selectedObjectProps.fill || '#000000'}
              label="Text Color"
              tooltipText="Text Color"
              documentColors={documentColors}
              onSelectColor={(c) => onSetFill(c)}
              align="center"
              triggerIcon={<span className="font-bold text-[11px] text-white">A</span>}
            />
          )}

          {/* Text Highlight Swatch Trigger */}
          {onSetTextBackgroundColor && (
            <CompactColorPopover
              currentColor={selectedObjectProps.textBackgroundColor || 'transparent'}
              label="Text Highlight"
              tooltipText="Text Highlight"
              documentColors={documentColors}
              allowTransparent={true}
              onSelectColor={(c) => onSetTextBackgroundColor(c)}
              align="center"
              triggerIcon={<span className="text-[9px] font-semibold text-slate-700">ab</span>}
            />
          )}

          {/* Text Alignment */}
          {onSetTextAlign && (
            <div className="flex items-center space-x-0.5 bg-slate-100/80 border border-slate-200/80 rounded-md p-0.5 h-6">
              <button
                type="button"
                onClick={() => onSetTextAlign('left')}
                className={`p-1 rounded ${
                  (selectedObjectProps.textAlign || 'left') === 'left' ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onSetTextAlign('center')}
                className={`p-1 rounded ${
                  selectedObjectProps.textAlign === 'center' ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onSetTextAlign('right')}
                className={`p-1 rounded ${
                  selectedObjectProps.textAlign === 'right' ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlignRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 3. SHAPE / VECTOR EDITING CONTROLS ---------------- */}
      {!isTextbox && !isImage && (
        <div className="flex items-center space-x-1">
          {/* Multi-slot Graphic Colors or Single Fill Swatch Trigger */}
          {selectedObjectProps.colorSlots && selectedObjectProps.colorSlots.length > 0 ? (
            <div className="flex items-center space-x-1 bg-slate-100/80 p-0.5 rounded-lg">
              {selectedObjectProps.colorSlots.slice(0, 6).map((slot) => (
                <CompactColorPopover
                  key={slot.id}
                  currentColor={slot.color}
                  slotId={slot.id}
                  slotLabel={slot.label}
                  tooltipText={`${slot.label}: ${slot.color}`}
                  documentColors={documentColors}
                  onSelectColor={(newColor) => {
                    if (onRecolorSlot) {
                      onRecolorSlot(slot.id, newColor);
                    } else if (onReplaceColor) {
                      onReplaceColor(slot.color, newColor);
                    } else if (onSetFill) {
                      onSetFill(newColor);
                    }
                  }}
                  onHoverSlot={onHoverSlot}
                  align="center"
                />
              ))}
            </div>
          ) : onSetFill ? (
            <CompactColorPopover
              currentColor={selectedObjectProps.fill || 'transparent'}
              label="Fill Color"
              tooltipText="Fill Color"
              documentColors={documentColors}
              allowTransparent={true}
              onSelectColor={(c) => onSetFill(c)}
              align="center"
            />
          ) : null}

          {/* Canva-Style Border & Corners Popover */}
          {onSetStroke && onSetStrokeDashStyle && (
            <BorderPopover
              compact
              stroke={selectedObjectProps.stroke || '#0284C7'}
              strokeWidth={selectedObjectProps.strokeWidth || 0}
              strokeDashArray={selectedObjectProps.strokeDashArray}
              rx={selectedObjectProps.rx || 0}
              supportsCornerRadius={isRect}
              onSetStroke={onSetStroke}
              onSetStrokeDashStyle={onSetStrokeDashStyle}
              onSetCornerRadius={onSetCornerRadius}
            />
          )}

          {/* Stroke Color Swatch Trigger (Active when border width > 0) */}
          {(selectedObjectProps.strokeWidth || 0) > 0 && onSetStroke && (
            <CompactColorPopover
              currentColor={selectedObjectProps.stroke || '#0284C7'}
              label="Border Color"
              tooltipText="Border Color"
              documentColors={documentColors}
              onSelectColor={(c) => onSetStroke(c, selectedObjectProps.strokeWidth)}
              align="center"
            />
          )}

          {/* Drop Shadow Toggle */}
          {onSetDropShadow && (
            <Tooltip content="Toggle Drop Shadow" side="top">
              <button
                type="button"
                onClick={() => onSetDropShadow(!selectedObjectProps.hasShadow)}
                className={`h-6 px-2 rounded-lg text-[11px] font-medium border transition-all ${
                  selectedObjectProps.hasShadow
                    ? 'bg-sky-100 text-sky-800 border-sky-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Shadow
              </button>
            </Tooltip>
          )}
        </div>
      )}

      {/* ---------------- 4. OPACITY CONTROLS ---------------- */}
      {onSetOpacity && (
        <div className="relative" ref={opacityRef}>
          <Tooltip content="Opacity" side="top">
            <button
              type="button"
              onClick={() => setIsOpacityOpen(!isOpacityOpen)}
              className="h-6 px-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center space-x-1 text-[11px] font-mono tabular-nums active:scale-95 transition-all"
            >
              <Eye className="w-3 h-3 text-slate-400" />
              <span>{Math.round((selectedObjectProps.opacity ?? 1) * 100)}%</span>
            </button>
          </Tooltip>
          {isOpacityOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-48 bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-xl p-3 animate-popover">
              <div className="flex justify-between items-center text-xs text-slate-700 font-medium mb-1.5">
                <span>Opacity</span>
                <span className="font-mono tabular-nums">{Math.round((selectedObjectProps.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedObjectProps.opacity ?? 1}
                onChange={(e) => onSetOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
            </div>
          )}
        </div>
      )}

      <div className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />

      {/* ---------------- 5. CORE ACTIONS ---------------- */}
      {/* Duplicate */}
      <Tooltip content="Duplicate" shortcut="Ctrl+D" side="top">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      {/* Lock / Unlock */}
      <Tooltip content={isLocked ? 'Unlock Object' : 'Lock Object'} shortcut="Ctrl+L" side="top">
        <button
          type="button"
          onClick={onToggleLock}
          className={`p-1.5 rounded-lg active:scale-95 transition-all ${
            isLocked
              ? 'bg-amber-100 text-amber-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </Tooltip>

      {/* Layer Forward / Backward */}
      <div className="flex items-center space-x-0.5 bg-slate-100/70 p-0.5 rounded-lg">
        <Tooltip content="Bring Forward" shortcut="]" side="top">
          <button
            type="button"
            onClick={onBringForward}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded active:scale-95 transition-all"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Send Backward" shortcut="[" side="top">
          <button
            type="button"
            onClick={onSendBackward}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded active:scale-95 transition-all"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-3.5 bg-slate-200 mx-0.5 shrink-0" />

      {/* Delete */}
      <Tooltip content="Delete Object" shortcut="Del" side="top">
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg active:scale-95 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
    </div>
  );
};
