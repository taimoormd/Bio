import React, { useState, useMemo } from 'react';
import { X, Search, Pipette, Palette, Check } from 'lucide-react';
import { useEditorStore, type ColorPanelTarget } from '../../stores/useEditorStore';

export interface ColorSidePanelProps {
  onSelectColor: (target: ColorPanelTarget, color: string) => void;
  onReplaceColor?: (oldHex: string, newHex: string) => void;
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
  {
    name: 'Vibrant Bio',
    colors: ['#10B981', '#6366F1', '#EC4899', '#F97316'],
  },
];

const DEFAULT_COLORS = [
  '#000000', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0', '#F1F5F9', '#FFFFFF',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#E11D48', '#9F1239', '#7C2D12',
];

export const ColorSidePanel: React.FC<ColorSidePanelProps> = ({
  onSelectColor,
  onReplaceColor,
}) => {
  const {
    isColorPanelOpen,
    colorPanelTarget,
    closeColorPanel,
    documentColors,
    selectedObjectProps,
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [hexInput, setHexInput] = useState('#0284C7');

  const currentColor = useMemo(() => {
    if (!selectedObjectProps || !colorPanelTarget) return '#0284C7';
    switch (colorPanelTarget) {
      case 'fill': return selectedObjectProps.fill || '#0284C7';
      case 'stroke': return selectedObjectProps.stroke || '#0284C7';
      case 'textColor': return selectedObjectProps.fill || '#000000';
      case 'textHighlight': return selectedObjectProps.textBackgroundColor || 'transparent';
      default: return '#0284C7';
    }
  }, [selectedObjectProps, colorPanelTarget]);

  const extractedColors = selectedObjectProps?.extractedColors || [];

  const isTransparent =
    !currentColor ||
    currentColor === 'transparent' ||
    currentColor === 'none' ||
    currentColor === 'rgba(0,0,0,0)';

  const targetLabel = useMemo(() => {
    switch (colorPanelTarget) {
      case 'fill': return 'Fill Color';
      case 'stroke': return 'Border Color';
      case 'textColor': return 'Text Color';
      case 'textHighlight': return 'Highlight Color';
      default: return 'Color';
    }
  }, [colorPanelTarget]);

  const handleSelectColor = (color: string) => {
    onSelectColor(colorPanelTarget, color);
    if (color !== 'transparent' && color !== 'none') {
      setHexInput(color);
    }
  };

  const handleEyedropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleSelectColor(result.sRGBHex);
        }
      } catch {
        // User canceled
      }
    }
  };

  // Filter default colors by search query
  const filteredColors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DEFAULT_COLORS;
    return DEFAULT_COLORS.filter((c) => c.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <aside
      style={{
        transition:
          'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`absolute left-16 top-0 z-20 w-80 bg-white border-r border-slate-200/90 shadow-xl shadow-slate-900/10 flex flex-col h-full overflow-hidden select-none ${
        isColorPanelOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : '-translate-x-8 opacity-0 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{targetLabel}</h2>
            <p className="text-xs text-slate-500">Pick or search colors</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeColorPanel}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-sky-500 focus-within:bg-white focus-within:border focus-within:border-sky-300 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Try "blue" or "#00c4cc"'
            className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden pl-2"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">

        {/* Transparent option */}
        {(colorPanelTarget === 'fill' || colorPanelTarget === 'textHighlight') && (
          <button
            type="button"
            onClick={() => handleSelectColor('transparent')}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
              isTransparent
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            No fill (Transparent)
          </button>
        )}

        {/* Colors in Graphic (SVG multi-channel recoloring) */}
        {extractedColors.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-sky-600" />
                Colors in this graphic
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {extractedColors.length} channels
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {extractedColors.map((color, idx) => (
                <label
                  key={`${color}-${idx}`}
                  title={`Recolor channel ${color}`}
                  className="relative w-8 h-8 rounded-lg border border-slate-300 shadow-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer overflow-hidden"
                  style={{ backgroundColor: color }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      if (onReplaceColor) {
                        onReplaceColor(color, e.target.value);
                      } else {
                        handleSelectColor(e.target.value);
                      }
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Colors in this design (document colors) */}
        {documentColors.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Palette className="w-3 h-3 text-violet-600" />
              Colors in this design
            </span>
            <div className="flex flex-wrap gap-2">
              {documentColors.slice(0, 20).map((color, idx) => {
                const isSelected =
                  currentColor && currentColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={`${color}-${idx}`}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    title={color}
                    style={{ backgroundColor: color }}
                    className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-sky-500 ring-offset-1 scale-110 border-white shadow-xs'
                        : 'border-slate-300/80 hover:scale-110 hover:shadow-xs'
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

        {/* Scientific Themes */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-800">
            Scientific Themes
          </span>
          <div className="space-y-1">
            {SCIENTIFIC_THEMES.map((theme) => (
              <div
                key={theme.name}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-colors"
              >
                <span className="text-xs text-slate-700 font-medium">
                  {theme.name}
                </span>
                <div className="flex items-center space-x-1.5">
                  {theme.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleSelectColor(c)}
                      title={`${theme.name} — ${c}`}
                      style={{ backgroundColor: c }}
                      className="w-6 h-6 rounded-md border border-slate-300/70 hover:scale-125 transition-transform"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Default solid colors */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-800">
            Default solid colors
          </span>
          <div className="flex flex-wrap gap-1.5">
            {filteredColors.map((color) => {
              const isSelected =
                currentColor && currentColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelectColor(color)}
                  title={color}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-sky-500 ring-offset-1 scale-110 border-white shadow-xs'
                      : color === '#FFFFFF'
                      ? 'border-slate-300 hover:scale-110'
                      : 'border-slate-300/60 hover:scale-110'
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

        {/* Custom Hex / Eyedropper */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800">Custom color</span>
          <div className="flex items-center space-x-2">
            {/* Native color picker trigger */}
            <label
              title="Open Color Spectrum"
              className="relative w-9 h-9 rounded-lg border border-slate-300/90 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform bg-gradient-to-tr from-sky-400 via-rose-400 to-amber-300"
            >
              <input
                type="color"
                value={hexInput.startsWith('#') && hexInput.length === 7 ? hexInput : '#0284C7'}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  handleSelectColor(e.target.value);
                }}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>

            {/* Eyedropper */}
            {typeof window !== 'undefined' && 'EyeDropper' in window && (
              <button
                type="button"
                onClick={handleEyedropper}
                title="Pick color from screen"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
              >
                <Pipette className="w-4 h-4" />
              </button>
            )}

            {/* Hex Text Input */}
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
              <span className="text-xs text-slate-400 font-mono select-none">#</span>
              <input
                type="text"
                value={hexInput.replace('#', '')}
                onChange={(e) => {
                  const val = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                  setHexInput(val);
                  if (val.length === 7) {
                    handleSelectColor(val);
                  }
                }}
                className="w-full bg-transparent text-xs font-mono text-slate-800 uppercase focus:outline-hidden pl-1"
                placeholder="0284C7"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
