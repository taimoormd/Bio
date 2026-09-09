import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Lock,
  Unlock,
  Trash2,
  Bold,
  Italic,
  Underline,
  FolderPlus,
  FolderMinus,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import type { SelectionBounds } from '../../core/canvas/CanvasEngine';
import { Tooltip } from '../ui/Tooltip';
import { CompactColorPopover } from '../toolbar/popovers/CompactColorPopover';
import { useEditorStore } from '../../stores/useEditorStore';

export interface FloatingActionBarProps {
  bounds: SelectionBounds | null;
  isLocked?: boolean;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  if (!bounds || bounds.width <= 0 || bounds.height <= 0 || !selectedObjectProps) {
    return null;
  }

  const toolbarHeight = 38;
  const gap = 10;
  const showAbove = bounds.top - toolbarHeight - gap >= 12;
  const top = showAbove
    ? bounds.top - toolbarHeight - gap
    : bounds.top + bounds.height + gap;
  const left = bounds.left + bounds.width / 2;

  const isTextbox = selectedObjectProps.type === 'textbox' || !!selectedObjectProps.text;
  const isImage = selectedObjectProps.type === 'image' || selectedObjectProps.type === 'FabricImage';
  const isGroup = selectedObjectProps.type === 'group';

  return (
    <div
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
      }}
      className="absolute z-30 flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl px-1.5 py-1 space-x-1 select-none pointer-events-auto transition-all duration-100 ease-out animate-floating-pill"
    >
      {/* 1. Multi-selection group buttons */}
      {selectedObjectCount > 1 && onGroup && (
        <Tooltip content="Group Objects" shortcut="Ctrl+G" side="top">
          <button
            type="button"
            onClick={onGroup}
            className="h-6 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium flex items-center space-x-1 active:scale-95 transition-all"
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
            className="h-6 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium flex items-center space-x-1 active:scale-95 transition-all"
          >
            <FolderMinus className="w-3.5 h-3.5" />
            <span>Ungroup</span>
          </button>
        </Tooltip>
      )}

      {/* 2. Text formatting: Font size stepper, B, I, U, Color */}
      {isTextbox && (
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md p-0.5 h-6">
            <button
              type="button"
              onClick={() => onSetFontSize?.(Math.max(6, (selectedObjectProps.fontSize || 16) - 2))}
              className="px-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs"
            >
              -
            </button>
            <span className="w-6 text-center text-slate-700 dark:text-zinc-200 font-mono text-[11px] tabular-nums">
              {Math.round(selectedObjectProps.fontSize || 16)}
            </span>
            <button
              type="button"
              onClick={() => onSetFontSize?.(Math.min(160, (selectedObjectProps.fontSize || 16) + 2))}
              className="px-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs"
            >
              +
            </button>
          </div>

          <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md p-0.5 h-6">
            {onToggleBold && (
              <button
                type="button"
                onClick={onToggleBold}
                className={`p-1 rounded ${
                  selectedObjectProps.fontWeight === 'bold' ||
                  (typeof selectedObjectProps.fontWeight === 'number' && selectedObjectProps.fontWeight >= 700)
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
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
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
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
                  selectedObjectProps.underline
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Underline className="w-3 h-3" />
              </button>
            )}
          </div>

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
        </div>
      )}

      {/* 3. Shape / Graphic Color Swatches */}
      {!isTextbox && !isImage && (
        <div className="flex items-center space-x-1">
          {selectedObjectProps.colorSlots && selectedObjectProps.colorSlots.length > 0 ? (
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg">
              {selectedObjectProps.colorSlots.slice(0, 5).map((slot) => (
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
        </div>
      )}

      <div className="w-px h-4 bg-slate-200 dark:bg-zinc-700 mx-0.5 shrink-0" />

      {/* 4. Quick Duplicate */}
      <Tooltip content="Duplicate" shortcut="Ctrl+D" side="top">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg active:scale-95 transition-all"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      {/* 5. Quick Lock / Unlock */}
      <Tooltip content={isLocked ? 'Unlock Object' : 'Lock Object'} shortcut="Ctrl+L" side="top">
        <button
          type="button"
          onClick={onToggleLock}
          className={`p-1.5 rounded-lg active:scale-95 transition-all ${
            isLocked
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </Tooltip>

      {/* 6. More Actions (··· Menu) */}
      <div className="relative">
        <Tooltip content="More Actions" side="top">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-1.5 rounded-lg active:scale-95 transition-all ${
              isMenuOpen
                ? 'bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 select-none animate-popover space-y-0.5 text-xs text-slate-700 dark:text-zinc-300"
          >
            {/* Layer Ordering */}
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Layer
            </div>
            <button
              type="button"
              onClick={() => {
                onBringForward();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                <span>Bring Forward</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">]</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSendBackward();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Send Backward</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">[</span>
            </button>
            {onBringToFront && (
              <button
                type="button"
                onClick={() => {
                  onBringToFront();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ChevronsUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bring to Front</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Ctrl+]</span>
              </button>
            )}
            {onSendToBack && (
              <button
                type="button"
                onClick={() => {
                  onSendToBack();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ChevronsDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Send to Back</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Ctrl+[</span>
              </button>
            )}

            <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />

            {/* Quick Actions */}
            <button
              type="button"
              onClick={() => {
                onDuplicate();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Duplicate</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Ctrl+D</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleLock();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {isLocked ? <Unlock className="w-3.5 h-3.5 text-slate-500" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isLocked ? 'Unlock' : 'Lock'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Ctrl+L</span>
            </button>

            <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                onDelete();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </div>
              <span className="text-[10px] font-mono text-rose-400">Del</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. Quick Delete */}
      <Tooltip content="Delete Object" shortcut="Del" side="top">
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg active:scale-95 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
    </div>
  );
};
