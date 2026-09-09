import React from 'react';
import { Copy, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import type { SelectionBounds } from '../../core/canvas/CanvasEngine';

interface FloatingContextualToolbarProps {
  bounds: SelectionBounds | null;
  extractedColors?: string[];
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSetFill: (color: string) => void;
  onReplaceColor?: (oldHex: string, newHex: string) => void;
  onDelete: () => void;
}

const DEFAULT_SWATCHES = [
  { name: 'Nature Blue', color: '#2B5C8F' },
  { name: 'Cell Teal', color: '#0891B2' },
  { name: 'Coral Red', color: '#F43F5E' },
  { name: 'Slate Dark', color: '#1E293B' },
];

export const FloatingContextualToolbar: React.FC<FloatingContextualToolbarProps> = ({
  bounds,
  extractedColors,
  onDuplicate,
  onBringForward,
  onSendBackward,
  onSetFill,
  onReplaceColor,
  onDelete,
}) => {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  const toolbarHeight = 40;
  const gap = 10;
  // Position above the object, or flip below if too close to top edge
  const showAbove = bounds.top - toolbarHeight - gap >= 12;
  const top = showAbove
    ? bounds.top - toolbarHeight - gap
    : bounds.top + bounds.height + gap;
  const left = bounds.left + bounds.width / 2;

  const hasExtracted = extractedColors && extractedColors.length > 0;
  const displayColors = hasExtracted ? extractedColors.slice(0, 8) : null;

  return (
    <div
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateX(-50%)',
      }}
      className="absolute z-30 flex items-center bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-xl px-2 py-1 space-x-1 select-none pointer-events-auto transition-all duration-100 ease-out animate-floating-pill"
    >
      {/* Duplicate */}
      <button
        type="button"
        title="Duplicate (Ctrl+D)"
        onClick={onDuplicate}
        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Layer Ordering */}
      <button
        type="button"
        title="Bring Forward (])"
        onClick={onBringForward}
        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Send Backward ([)"
        onClick={onSendBackward}
        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-200 mx-0.5" />

      {/* Extracted Graphic Colors or Default Quick Palette */}
      <div className="flex items-center space-x-1.5 px-1">
        {displayColors ? (
          displayColors.map((color, idx) => (
            <label
              key={`${color}-${idx}`}
              title={`Recolor channel ${color} (Click to change)`}
              className="relative w-4 h-4 rounded-full border border-slate-300/80 shadow-xs hover:scale-125 active:scale-90 transition-transform cursor-pointer overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  if (onReplaceColor) {
                    onReplaceColor(color, e.target.value);
                  } else {
                    onSetFill(e.target.value);
                  }
                }}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>
          ))
        ) : (
          DEFAULT_SWATCHES.map((swatch) => (
            <button
              key={swatch.color}
              type="button"
              title={swatch.name}
              onClick={() => onSetFill(swatch.color)}
              style={{ backgroundColor: swatch.color }}
              className="w-4 h-4 rounded-full border border-slate-300/60 shadow-xs hover:scale-125 active:scale-90 transition-transform cursor-pointer"
            />
          ))
        )}
      </div>

      <div className="w-px h-4 bg-slate-200 mx-0.5" />

      {/* Delete */}
      <button
        type="button"
        title="Delete (Del)"
        onClick={onDelete}
        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg active:scale-95 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
