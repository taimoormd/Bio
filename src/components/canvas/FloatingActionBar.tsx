import React from 'react';
import { Copy, Lock, Unlock, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import type { SelectionBounds } from '../../core/canvas/CanvasEngine';
import { Tooltip } from '../ui/Tooltip';

export interface FloatingActionBarProps {
  bounds: SelectionBounds | null;
  isLocked?: boolean;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  bounds,
  isLocked = false,
  onDuplicate,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onDelete,
}) => {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  const toolbarHeight = 38;
  const gap = 10;
  // Position cleanly above selection, or flip below if too close to the top edge
  const showAbove = bounds.top - toolbarHeight - gap >= 12;
  const top = showAbove
    ? bounds.top - toolbarHeight - gap
    : bounds.top + bounds.height + gap;
  const left = bounds.left + bounds.width / 2;

  return (
    <div
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
      }}
      className="absolute z-30 flex items-center bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-xl px-1 py-0.5 space-x-0.5 select-none pointer-events-auto transition-all duration-100 ease-out animate-floating-pill"
    >
      {/* 1. Duplicate */}
      <Tooltip content="Duplicate" shortcut="Ctrl+D" side="top">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg active:scale-95 transition-all"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </Tooltip>

      {/* 2. Lock / Unlock */}
      <Tooltip content={isLocked ? 'Unlock Object' : 'Lock Object'} shortcut="Ctrl+L" side="top">
        <button
          type="button"
          onClick={onToggleLock}
          className={`p-1.5 rounded-lg active:scale-95 transition-all ${
            isLocked
              ? 'bg-amber-100 text-amber-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </Tooltip>

      {/* 3. Layer Forward / Backward */}
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

      <div className="w-px h-3.5 bg-slate-200 mx-0.5" />

      {/* 4. Delete */}
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
