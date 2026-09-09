import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Palette, Check } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

export interface CompactColorPopoverProps {
  currentColor: string;
  slotId?: string;
  slotLabel?: string;
  documentColors?: string[];
  label?: string;
  allowTransparent?: boolean;
  tooltipText?: string;
  shortcut?: string;
  triggerIcon?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  onSelectColor: (color: string) => void;
  onHoverSlot?: (slotId: string | null) => void;
}

const SCIENTIFIC_THEMES = [
  {
    name: 'Nature Muted',
    colors: ['#14B8A6', '#2B5C8F', '#0EA5E9', '#64748B'],
  },
  {
    name: 'Cell Contrast',
    colors: ['#F43F5E', '#0891B2', '#8B5CF6', '#F59E0B'],
  },
  {
    name: 'Classic Science',
    colors: ['#1E3A8A', '#DC2626', '#16A34A', '#D97706'],
  },
  {
    name: 'Monochromatic',
    colors: ['#0F172A', '#334155', '#64748B', '#CBD5E1'],
  },
];

const STANDARD_SWATCHES = [
  '#000000', '#475569', '#94A3B8', '#CBD5E1', '#F1F5F9', '#FFFFFF',
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#0284C7',
  '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#84CC16', '#14B8A6',
];

export const CompactColorPopover: React.FC<CompactColorPopoverProps> = ({
  currentColor,
  slotId,
  slotLabel,
  documentColors = [],
  label,
  allowTransparent = true,
  tooltipText = 'Color Picker',
  shortcut,
  triggerIcon,
  align = 'left',
  onSelectColor,
  onHoverSlot,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(currentColor || '#0284C7');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (currentColor && currentColor !== 'transparent' && currentColor !== 'none') {
      setHexInput(currentColor);
    }
  }, [currentColor]);

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
        if (slotId && onHoverSlot) {
          onHoverSlot(null);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        if (slotId && onHoverSlot) {
          onHoverSlot(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, slotId, onHoverSlot]);

  const handleEyedropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onSelectColor(result.sRGBHex);
          setHexInput(result.sRGBHex);
        }
      } catch {
        // User canceled eyedropper
      }
    }
  };

  const isTransparent =
    !currentColor ||
    currentColor === 'transparent' ||
    currentColor === 'none' ||
    currentColor === 'rgba(0,0,0,0)';

  const alignmentClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <div className="relative inline-block text-left">
      <Tooltip content={tooltipText} shortcut={shortcut}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            const next = !isOpen;
            setIsOpen(next);
            if (slotId && onHoverSlot) {
              onHoverSlot(next ? slotId : null);
            }
          }}
          onMouseEnter={() => {
            if (slotId && onHoverSlot) {
              onHoverSlot(slotId);
            }
          }}
          onMouseLeave={() => {
            if (slotId && onHoverSlot && !isOpen) {
              onHoverSlot(null);
            }
          }}
          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all select-none relative overflow-hidden ${
            isOpen
              ? 'ring-2 ring-sky-500 ring-offset-1 border-sky-400'
              : 'border-slate-300/90 shadow-2xs hover:scale-105 active:scale-95'
          }`}
          style={{
            backgroundColor: isTransparent ? '#FFFFFF' : currentColor,
          }}
        >
          {isTransparent ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <div className="absolute w-[120%] h-[1.5px] bg-rose-500 rotate-45" />
              {triggerIcon && (
                <span className="relative z-10 text-xs font-bold text-slate-700">
                  {triggerIcon}
                </span>
              )}
            </div>
          ) : triggerIcon ? (
            <div className="flex items-center justify-center w-full h-full">
              {triggerIcon}
            </div>
          ) : null}
        </button>
      </Tooltip>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute top-9 z-50 w-[270px] bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-3 space-y-3 animate-popover select-none ${alignmentClass}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 truncate max-w-[170px]">
              <Palette className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">{slotLabel || label || 'Color'}</span>
            </span>
            {allowTransparent && (
              <button
                type="button"
                onClick={() => {
                  onSelectColor('transparent');
                  setIsOpen(false);
                  if (slotId && onHoverSlot) onHoverSlot(null);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition-all ${
                  isTransparent
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                None
              </button>
            )}
          </div>

          {/* Hex Input & Eyedropper */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <div
                className="w-5 h-5 rounded-md border border-slate-200 shrink-0 ml-1 mr-1.5 shadow-2xs"
                style={{ backgroundColor: isTransparent ? 'transparent' : currentColor }}
              />
              <span className="text-xs text-slate-400 select-none font-mono">#</span>
              <input
                type="text"
                value={hexInput.replace('#', '')}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setHexInput(`#${val}`);
                  if (/^#?[0-9A-Fa-f]{6}$/.test(`#${val}`)) {
                    onSelectColor(`#${val}`);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (/^#?[0-9A-Fa-f]{6}$/.test(hexInput)) {
                      onSelectColor(hexInput.startsWith('#') ? hexInput : `#${hexInput}`);
                    }
                  }
                }}
                maxLength={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-xs font-mono font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 uppercase"
                placeholder="HEX"
              />
            </div>

            {/* Native color picker trigger */}
            <label
              title="Custom Color Wheel"
              className="w-7 h-7 rounded-lg border border-slate-200 hover:border-slate-300 flex items-center justify-center cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors relative overflow-hidden"
            >
              <span
                className="w-4 h-4 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                }}
              />
              <input
                type="color"
                value={isTransparent ? '#0284C7' : currentColor}
                onChange={(e) => {
                  onSelectColor(e.target.value);
                  setHexInput(e.target.value);
                }}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>

            {/* Eyedropper API */}
            {typeof window !== 'undefined' && 'EyeDropper' in window && (
              <button
                type="button"
                onClick={handleEyedropper}
                title="Sample canvas color"
                className="w-7 h-7 rounded-lg border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-600 hover:text-sky-600 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Pipette className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Document Colors */}
          {documentColors && documentColors.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Document Colors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {documentColors.slice(0, 12).map((color, idx) => {
                  const isSelected =
                    currentColor && currentColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={`${color}-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectColor(color);
                        setHexInput(color);
                      }}
                      title={color}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-md border transition-transform flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-sky-500 ring-offset-1 scale-110 border-white shadow-xs'
                          : 'border-slate-200/80 hover:scale-110'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white drop-shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scientific Themes */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Scientific Themes
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SCIENTIFIC_THEMES.map((theme) => (
                <div
                  key={theme.name}
                  className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-100 flex flex-col gap-1 hover:border-slate-200 transition-colors"
                >
                  <span className="text-[9px] font-medium text-slate-500 truncate">
                    {theme.name}
                  </span>
                  <div className="flex gap-1">
                    {theme.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onSelectColor(c);
                          setHexInput(c);
                        }}
                        title={c}
                        style={{ backgroundColor: c }}
                        className="flex-1 h-3.5 rounded-xs hover:scale-110 active:scale-95 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Standard Palette */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Default Palette
            </span>
            <div className="grid grid-cols-6 gap-1">
              {STANDARD_SWATCHES.map((color) => {
                const isSelected =
                  currentColor && currentColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onSelectColor(color);
                      setHexInput(color);
                    }}
                    title={color}
                    style={{ backgroundColor: color }}
                    className={`h-4.5 rounded-sm border transition-transform flex items-center justify-center ${
                      isSelected
                        ? 'ring-1.5 ring-sky-500 scale-110 border-white shadow-2xs'
                        : 'border-slate-200/60 hover:scale-110'
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-2.5 h-2.5 text-white drop-shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
