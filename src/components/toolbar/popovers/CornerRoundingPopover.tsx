import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, CornerDownRight } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

export interface CornerRoundingPopoverProps {
  rx: number;
  onSetCornerRadius: (radius: number) => void;
  compact?: boolean;
  align?: 'left' | 'center' | 'right';
}

const PRESET_RADII = [0, 4, 8, 16, 24, 99];

export const CornerRoundingPopover: React.FC<CornerRoundingPopoverProps> = ({
  rx = 0,
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

  return (
    <div className="relative inline-block text-left">
      <Tooltip content="Corner Rounding" shortcut="R">
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
          {/* Canva-style Corner Fillet Icon */}
          <div className="w-3.5 h-3.5 relative flex items-center justify-center">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              className="w-3.5 h-3.5"
              strokeWidth="1.75"
            >
              <path d="M3 13V7a4 4 0 0 1 4-4h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 3h4v4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-zinc-300">
            {rx > 0 ? `${rx}px` : '0px'}
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
          } top-full mt-1.5 z-50 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-3.5 space-y-3.5 animate-popover select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-sky-600" />
              Corner Rounding
            </span>
            <span className="text-[10px] font-mono text-slate-400">Radius</span>
          </div>

          {/* Stepper + Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-700">
              <span className="font-medium">Rounding</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onSetCornerRadius(Math.max(0, rx - 2))}
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
                    onSetCornerRadius(
                      Math.min(100, Math.max(0, Number(e.target.value) || 0))
                    )
                  }
                  className="w-10 text-center bg-slate-50 border border-slate-200 rounded px-0.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-800 focus:outline-hidden focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => onSetCornerRadius(Math.min(100, rx + 2))}
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
              onChange={(e) => onSetCornerRadius(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
          </div>

          {/* Preset Quick Chips */}
          <div className="pt-1 border-t border-slate-100">
            <div className="text-[10px] font-medium text-slate-400 mb-1.5">Presets</div>
            <div className="grid grid-cols-6 gap-1">
              {PRESET_RADII.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSetCornerRadius(preset)}
                  className={`py-1 text-[10px] font-mono font-medium rounded-md border transition-all ${
                    rx === preset
                      ? 'bg-sky-50 text-sky-700 border-sky-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {preset === 0 ? 'Sharp' : preset === 99 ? 'Full' : `${preset}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
