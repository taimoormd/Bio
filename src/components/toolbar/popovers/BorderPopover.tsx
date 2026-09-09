import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

export interface BorderPopoverProps {
  stroke: string;
  strokeWidth: number;
  strokeDashArray?: number[] | null;
  rx?: number;
  supportsCornerRadius?: boolean;
  onSetStroke: (color: string, width?: number) => void;
  onSetStrokeDashStyle: (style: 'solid' | 'dashed' | 'dotted' | 'none') => void;
  onSetCornerRadius?: (radius: number) => void;
  compact?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const BorderPopover: React.FC<BorderPopoverProps> = ({
  stroke,
  strokeWidth,
  strokeDashArray,
  onSetStroke,
  onSetStrokeDashStyle,
  compact = false,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Determine current active style pill
  const activeStyle =
    strokeWidth === 0
      ? 'none'
      : !strokeDashArray || strokeDashArray.length === 0
      ? 'solid'
      : strokeDashArray[0] === 3
      ? 'dotted'
      : 'dashed';

  const handleStyleSelect = (style: 'none' | 'solid' | 'dashed' | 'dotted') => {
    if (style === 'none') {
      onSetStroke(stroke || '#0284C7', 0);
      onSetStrokeDashStyle('none');
    } else {
      if (strokeWidth === 0) {
        onSetStroke(stroke || '#0284C7', 2);
      }
      onSetStrokeDashStyle(style);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <Tooltip content="Border Style" shortcut="B">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${
            compact ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs'
          } rounded-md flex items-center space-x-1.5 font-medium transition-colors select-none ${
            isOpen
              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
              : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          {/* Canva-style Stroke Weight & Style Icon */}
          <div className="w-3.5 h-3.5 relative flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <line x1="2" y1="4" x2="14" y2="4" strokeWidth="1.5" />
              <line
                x1="2"
                y1="8"
                x2="14"
                y2="8"
                strokeWidth="2.5"
                strokeDasharray={
                  activeStyle === 'dashed' ? '3 2' : activeStyle === 'dotted' ? '1 2' : undefined
                }
              />
              <line x1="2" y1="12" x2="14" y2="12" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-slate-600">
            {strokeWidth > 0 ? `${strokeWidth}px` : 'None'}
          </span>
        </button>
      </Tooltip>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute ${
            align === 'center'
              ? 'left-1/2 -translate-x-1/2'
              : align === 'right'
              ? 'right-0'
              : 'left-0'
          } top-full mt-1.5 z-50 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-3.5 space-y-3.5 animate-popover select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" className="w-3.5 h-3.5 text-sky-600">
                <line x1="2" y1="5" x2="14" y2="5" strokeWidth="2" />
                <line x1="2" y1="11" x2="14" y2="11" strokeWidth="2" strokeDasharray="3 2" />
              </svg>
              Border Style
            </span>
            <span className="text-[10px] font-mono text-slate-400">Stroke styling</span>
          </div>

          {/* Section 1: Line Style Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600 block">
              Line Style
            </label>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleStyleSelect('none')}
                className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                  activeStyle === 'none'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect('solid')}
                className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                  activeStyle === 'solid'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Solid"
              >
                Solid ──
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect('dashed')}
                className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                  activeStyle === 'dashed'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dashed"
              >
                Dashed ╌
              </button>
              <button
                type="button"
                onClick={() => handleStyleSelect('dotted')}
                className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                  activeStyle === 'dotted'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dotted"
              >
                Dotted ···
              </button>
            </div>
          </div>

          {/* Section 2: Border Weight Slider & Stepper */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-700">
              <span className="font-medium">Border Weight</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onSetStroke(stroke, Math.max(0, strokeWidth - 1))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={strokeWidth}
                  onChange={(e) =>
                    onSetStroke(stroke, Math.min(30, Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-8 text-center bg-slate-50 border border-slate-200 rounded px-0.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-800 focus:outline-hidden focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => onSetStroke(stroke, Math.min(30, strokeWidth + 1))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <span className="text-slate-400 text-[10px] pl-0.5 font-mono">px</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={strokeWidth}
              onChange={(e) => onSetStroke(stroke, Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};
