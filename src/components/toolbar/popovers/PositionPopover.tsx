import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

export interface PositionPopoverProps {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  selectedCount: number;
  onSetX: (x: number) => void;
  onSetY: (y: number) => void;
  onSetWidth: (w: number) => void;
  onSetHeight: (h: number) => void;
  onSetAngle: (angle: number) => void;
  onAlign: (alignment: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onFlipX: () => void;
  onFlipY: () => void;
}

export const PositionPopover: React.FC<PositionPopoverProps> = ({
  left,
  top,
  width,
  height,
  angle,
  selectedCount,
  onSetX,
  onSetY,
  onSetWidth,
  onSetHeight,
  onSetAngle,
  onAlign,
  onDistribute,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onFlipX,
  onFlipY,
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
      <Tooltip content="Position, Alignment & Dimensions">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-7 px-2.5 rounded-lg flex items-center space-x-1.5 border text-xs font-medium transition-all select-none ${
            isOpen
              ? 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Position</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </Tooltip>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-9 z-50 w-80 bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-3.5 space-y-3.5 animate-popover select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
              Position & Align
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedCount > 1 ? `${selectedCount} items` : '1 item'}
            </span>
          </div>

          {/* 1. Alignment */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Align to {selectedCount > 1 ? 'Selection' : 'Artboard'}
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => onAlign('left')}
                className="flex items-center justify-center space-x-1 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                title="Align Left"
              >
                <AlignStartHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Left</span>
              </button>
              <button
                type="button"
                onClick={() => onAlign('centerH')}
                className="flex items-center justify-center space-x-1 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                title="Center Horizontally"
              >
                <AlignCenterHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Center</span>
              </button>
              <button
                type="button"
                onClick={() => onAlign('right')}
                className="flex items-center justify-center space-x-1 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                title="Align Right"
              >
                <AlignEndHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Right</span>
              </button>
              <button
                type="button"
                onClick={() => onAlign('top')}
                className="flex items-center justify-center space-x-1 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                title="Align Top"
              >
                <AlignStartVertical className="w-3.5 h-3.5 text-slate-600" />
                <span>Top</span>
              </button>
              <button
                type="button"
                onClick={() => onAlign('centerV')}
                className="flex items-center justify-center space-x-1 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                title="Center Vertically"
              >
                <AlignCenterVertical className="w-3.5 h-3.5 text-slate-600" />
                <span>Middle</span>
              </button>
              <button
                type="button"
                onClick={() => onAlign('bottom')}
                className="flex items-center justify-center space-x-1 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                title="Align Bottom"
              >
                <AlignEndVertical className="w-3.5 h-3.5 text-slate-600" />
                <span>Bottom</span>
              </button>
            </div>
          </div>

          {/* Distribute Evenly (if multi-selection) */}
          {selectedCount > 2 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Distribute Evenly
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onDistribute('horizontal')}
                  className="flex items-center justify-center space-x-1.5 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                >
                  <AlignHorizontalDistributeCenter className="w-3.5 h-3.5 text-slate-600" />
                  <span>Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDistribute('vertical')}
                  className="flex items-center justify-center space-x-1.5 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-[11px] transition-colors"
                >
                  <AlignVerticalDistributeCenter className="w-3.5 h-3.5 text-slate-600" />
                  <span>Vertical</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Layer Arrangement */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Layer Order
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <button
                type="button"
                onClick={onBringForward}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700"
              >
                <span>Forward</span>
                <kbd className="font-mono text-[10px] text-slate-400">]</kbd>
              </button>
              <button
                type="button"
                onClick={onSendBackward}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700"
              >
                <span>Backward</span>
                <kbd className="font-mono text-[10px] text-slate-400">[</kbd>
              </button>
              <button
                type="button"
                onClick={onBringToFront}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700"
              >
                <span>To Front</span>
                <kbd className="font-mono text-[10px] text-slate-400">Ctrl+]</kbd>
              </button>
              <button
                type="button"
                onClick={onSendToBack}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700"
              >
                <span>To Back</span>
                <kbd className="font-mono text-[10px] text-slate-400">Ctrl+[</kbd>
              </button>
            </div>
          </div>

          {/* 3. Advanced Dimensions & Coordinates */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Advanced Coordinates
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* X */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-slate-400 font-mono text-[10px]">X</span>
                <input
                  type="number"
                  value={Math.round(left || 0)}
                  onChange={(e) => onSetX(Number(e.target.value))}
                  className="w-16 bg-transparent text-right font-mono text-slate-800 tabular-nums focus:outline-hidden"
                />
                <span className="text-slate-400 text-[10px] ml-1">px</span>
              </div>
              {/* Y */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-slate-400 font-mono text-[10px]">Y</span>
                <input
                  type="number"
                  value={Math.round(top || 0)}
                  onChange={(e) => onSetY(Number(e.target.value))}
                  className="w-16 bg-transparent text-right font-mono text-slate-800 tabular-nums focus:outline-hidden"
                />
                <span className="text-slate-400 text-[10px] ml-1">px</span>
              </div>
              {/* Width */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-slate-400 font-mono text-[10px]">W</span>
                <input
                  type="number"
                  value={Math.round(width || 0)}
                  onChange={(e) => onSetWidth(Number(e.target.value))}
                  className="w-16 bg-transparent text-right font-mono text-slate-800 tabular-nums focus:outline-hidden"
                />
                <span className="text-slate-400 text-[10px] ml-1">px</span>
              </div>
              {/* Height */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-slate-400 font-mono text-[10px]">H</span>
                <input
                  type="number"
                  value={Math.round(height || 0)}
                  onChange={(e) => onSetHeight(Number(e.target.value))}
                  className="w-16 bg-transparent text-right font-mono text-slate-800 tabular-nums focus:outline-hidden"
                />
                <span className="text-slate-400 text-[10px] ml-1">px</span>
              </div>
            </div>

            {/* Rotation & Flip Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-28">
                <span className="text-slate-400 text-[10px] mr-1">∠ Rotate</span>
                <input
                  type="number"
                  value={Math.round(angle || 0)}
                  onChange={(e) => onSetAngle(Number(e.target.value))}
                  className="w-10 bg-transparent text-right font-mono text-[11px] text-slate-800 tabular-nums focus:outline-hidden"
                />
                <span className="text-slate-400 text-[10px] ml-0.5">°</span>
              </div>

              <div className="flex items-center space-x-1">
                <Tooltip content="Flip Horizontal">
                  <button
                    type="button"
                    onClick={onFlipX}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-90 transition-transform"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip content="Flip Vertical">
                  <button
                    type="button"
                    onClick={onFlipY}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-90 transition-transform"
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
