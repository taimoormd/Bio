import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Palette, Check } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

export interface ColorPopoverProps {
  currentColor: string;
  extractedColors?: string[];
  documentColors?: string[];
  label?: string;
  allowTransparent?: boolean;
  tooltipText?: string;
  shortcut?: string;
  triggerIcon?: React.ReactNode;
  onSelectColor: (color: string) => void;
  onReplaceColorChannel?: (oldHex: string, newHex: string) => void;
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
    name: 'Monochromatic',
    colors: ['#0F172A', '#334155', '#64748B', '#CBD5E1'],
  },
];

export const ColorPopover: React.FC<ColorPopoverProps> = ({
  currentColor,
  extractedColors = [],
  documentColors = [],
  label = 'Color',
  allowTransparent = true,
  tooltipText = 'Color Picker',
  shortcut,
  triggerIcon,
  onSelectColor,
  onReplaceColorChannel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(currentColor || '#0284C7');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync internal hex text state with incoming currentColor
  useEffect(() => {
    if (currentColor && currentColor !== 'transparent' && currentColor !== 'none') {
      setHexInput(currentColor);
    }
  }, [currentColor]);

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

  return (
    <div className="relative inline-block text-left">
      <Tooltip content={tooltipText} shortcut={shortcut}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
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
              {/* Red diagonal strike for transparent/none */}
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
          className="absolute left-0 top-9 z-50 w-72 bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-3.5 space-y-3.5 animate-popover select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-sky-600" />
              {label}
            </span>
            {allowTransparent && (
              <button
                type="button"
                onClick={() => {
                  onSelectColor('transparent');
                  setIsOpen(false);
                }}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium border transition-all ${
                  isTransparent
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Transparent
              </button>
            )}
          </div>

          {/* 1. Colors in Graphic (if multi-color SVG graphic) */}
          {extractedColors && extractedColors.length > 1 && (
            <div className="space-y-1.5 p-2 bg-sky-50/60 rounded-xl border border-sky-100/90">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-sky-900">
                  Colors in Graphic
                </span>
                <span className="text-[10px] text-sky-700 font-mono">
                  {extractedColors.length} channels
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {extractedColors.map((color, idx) => (
                  <label
                    key={`${color}-${idx}`}
                    title={`Recolor channel ${color}`}
                    className="relative w-6 h-6 rounded-md border border-slate-300 shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        if (onReplaceColorChannel) {
                          onReplaceColorChannel(color, e.target.value);
                        } else {
                          onSelectColor(e.target.value);
                        }
                      }}
                      className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 2. Document Colors */}
          {documentColors && documentColors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-600 block">
                Document Colors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {documentColors.slice(0, 14).map((color, idx) => {
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
                      className={`w-6 h-6 rounded-md border transition-transform flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-sky-500 ring-offset-1 scale-110 border-white shadow-xs'
                          : 'border-slate-300/80 hover:scale-110'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Scientific Themes */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-600 block">
              Scientific Themes
            </span>
            <div className="space-y-1.5">
              {SCIENTIFIC_THEMES.map((theme) => (
                <div
                  key={theme.name}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-colors"
                >
                  <span className="text-[11px] text-slate-700 font-medium">
                    {theme.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    {theme.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onSelectColor(c);
                          setHexInput(c);
                        }}
                        title={`${theme.name} — ${c}`}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-md border border-slate-300/70 hover:scale-125 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Custom Hex/RGB input & Eyedropper */}
          <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
            {/* Interactive Color Spectrum / Native Picker */}
            <label
              title="Open Color Spectrum"
              className="relative w-8 h-8 rounded-lg border border-slate-300/90 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform bg-gradient-to-tr from-sky-400 via-rose-400 to-amber-300"
            >
              <input
                type="color"
                value={hexInput.startsWith('#') && hexInput.length === 7 ? hexInput : '#0284C7'}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  onSelectColor(e.target.value);
                }}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>

            {/* Eyedropper if supported */}
            {typeof window !== 'undefined' && 'EyeDropper' in window && (
              <button
                type="button"
                onClick={handleEyedropper}
                title="Pick color from screen (Eyedropper)"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
              >
                <Pipette className="w-4 h-4" />
              </button>
            )}

            {/* Hex Text Input */}
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
              <span className="text-[11px] text-slate-400 font-mono select-none">#</span>
              <input
                type="text"
                value={hexInput.replace('#', '')}
                onChange={(e) => {
                  const val = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                  setHexInput(val);
                  if (val.length === 7) {
                    onSelectColor(val);
                  }
                }}
                className="w-full bg-transparent text-[11px] font-mono text-slate-800 uppercase focus:outline-hidden pl-1"
                placeholder="0284C7"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
