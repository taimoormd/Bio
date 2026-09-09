import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, CornerDownRight, Square } from 'lucide-react';
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
  rx = 0,
  supportsCornerRadius = false,
  onSetStroke,
  onSetStrokeDashStyle,
  onSetCornerRadius,
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
      <Tooltip content="Border & Corners" shortcut="B">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${
            compact ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs'
          } rounded-lg flex items-center space-x-1.5 border font-medium transition-all select-none ${
            isOpen
              ? 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          {/* Visual icon for border & corner rounding */}
          <div className="w-3.5 h-3.5 relative flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              className="w-3.5 h-3.5"
              strokeWidth="1.75"
            >
              <rect x="2" y="2" width="12" height="12" rx="3" strokeDasharray={strokeWidth === 0 ? '2 2' : undefined} />
            </svg>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-slate-600">
            {strokeWidth > 0 ? `${strokeWidth}px` : 'None'}
          </span>
          {supportsCornerRadius && rx > 0 && (
            <span className="font-mono text-[10px] text-slate-400 border-l border-slate-300/80 pl-1.5 tabular-nums">
              r:{rx}
            </span>
          )}
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
          } top-full mt-1.5 z-50 w-72 bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-3.5 space-y-3.5 animate-popover select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 text-sky-600" />
              Border & Corners
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

          {/* Section 3: Corner Rounding (if shape supports corner radius) */}
          {supportsCornerRadius && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-700">
                <span className="font-medium flex items-center gap-1">
                  <CornerDownRight className="w-3 h-3 text-slate-400" />
                  Corner Rounding
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => onSetCornerRadius?.(Math.max(0, rx - 2))}
                    className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-90 transition-transform"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rx}
                    onChange={(e) =>
                      onSetCornerRadius?.(
                        Math.min(100, Math.max(0, Number(e.target.value) || 0))
                      )
                    }
                    className="w-8 text-center bg-slate-50 border border-slate-200 rounded px-0.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-800 focus:outline-hidden focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => onSetCornerRadius?.(Math.min(100, rx + 2))}
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
                max="100"
                step="1"
                value={rx}
                onChange={(e) => onSetCornerRadius?.(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
