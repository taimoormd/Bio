import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Lock,
  Unlock,
  Trash2,
  FolderPlus,
  FolderMinus,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  MessageSquare,
  Check,
} from 'lucide-react';
import type { SelectionBounds } from '../../core/canvas/CanvasEngine';
import { Tooltip } from '../ui/Tooltip';
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
  // Group actions
  onGroup?: () => void;
  onUngroup?: () => void;
  // Backwards compatibility props (formatting moved to Unified Top Ribbon)
  onSetFill?: (color: string) => void;
  onSetStroke?: (color: string, width?: number) => void;
  onSetStrokeDashStyle?: (style: 'solid' | 'dashed' | 'dotted' | 'none') => void;
  onSetCornerRadius?: (radius: number) => void;
  onSetDropShadow?: (enabled: boolean) => void;
  onSetOpacity?: (opacity: number) => void;
  onRecolorSlot?: (slotId: string, newHex: string) => void;
  onHoverSlot?: (slotId: string | null) => void;
  onReplaceColor?: (oldHex: string, newHex: string) => void;
  onSetFontSize?: (size: number) => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
  onSetTextAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onSetTextBackgroundColor?: (color: string) => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  bounds,
  isLocked = false,
  onDuplicate,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDelete,
  onGroup,
  onUngroup,
}) => {
  const { selectedObjectProps, selectedObjectCount } = useEditorStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savedNote, setSavedNote] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const noteButtonRef = useRef<HTMLButtonElement>(null);

  // Close menus on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen && !isNoteOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
      if (
        isNoteOpen &&
        noteRef.current &&
        !noteRef.current.contains(target) &&
        noteButtonRef.current &&
        !noteButtonRef.current.contains(target)
      ) {
        setIsNoteOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsNoteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, isNoteOpen]);

  if (!bounds || bounds.width <= 0 || bounds.height <= 0 || !selectedObjectProps) {
    return null;
  }

  const toolbarHeight = 36;
  const gap = 10;
  const showAbove = bounds.top - toolbarHeight - gap >= 12;
  const top = showAbove
    ? bounds.top - toolbarHeight - gap
    : bounds.top + bounds.height + gap;
  const left = bounds.left + bounds.width / 2;

  const isGroup = selectedObjectProps.type === 'group';

  return (
    <div
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
      }}
      className="absolute z-30 flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl px-1 py-1 space-x-1 select-none pointer-events-auto transition-all duration-100 ease-out animate-floating-pill"
    >
      {/* 1. Group / Ungroup (Contextual for multiple objects or group) */}
      {selectedObjectCount > 1 && onGroup && (
        <Tooltip content="Group Objects" shortcut="Ctrl+G" side="top">
          <button
            type="button"
            onClick={onGroup}
            className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium flex items-center space-x-1 active:scale-95 transition-all"
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
            className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium flex items-center space-x-1 active:scale-95 transition-all"
          >
            <FolderMinus className="w-3.5 h-3.5" />
            <span>Ungroup</span>
          </button>
        </Tooltip>
      )}

      {/* 2. Canva Item 1: Annotation Note / Comment (💬) */}
      <div className="relative">
        <Tooltip content={savedNote ? `Note: "${savedNote}"` : 'Add Note / Comment'} side="top">
          <button
            ref={noteButtonRef}
            type="button"
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className={`p-1.5 rounded-lg active:scale-95 transition-all ${
              savedNote
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200'
                : isNoteOpen
                ? 'bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {isNoteOpen && (
          <div
            ref={noteRef}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 select-none animate-popover space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                Annotation Note
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Scientific Note</span>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add observation, figure tag or citation..."
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 resize-none focus:outline-hidden focus:border-sky-500 h-18"
            />
            <div className="flex items-center justify-between">
              {savedNote ? (
                <button
                  type="button"
                  onClick={() => {
                    setSavedNote('');
                    setNoteText('');
                    setIsNoteOpen(false);
                  }}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-medium"
                >
                  Clear Note
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => {
                  setSavedNote(noteText.trim());
                  setIsNoteOpen(false);
                }}
                className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium flex items-center gap-1 active:scale-95 transition-all shadow-xs"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Canva Item 2: Quick Lock / Unlock (🔒) */}
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

      {/* 4. Canva Item 3: More Actions Menu (···) */}
      <div className="relative">
        <Tooltip content="More Actions" side="top">
          <button
            ref={menuButtonRef}
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
                {isLocked ? (
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
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
    </div>
  );
};
