import React from 'react';
import {
  Palette,
  ShieldCheck,
  ExternalLink,
  Layers,
  Dna,
  ArrowRight,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { Tooltip } from '../ui/Tooltip';

interface PropertiesPanelProps {
  onSetFill: (color: string) => void;
  onSetStroke: (color: string, width?: number) => void;
  onSetOpacity?: (opacity: number) => void;
  onUpdateBioParams: (params: any) => void;
  onReplaceColor?: (oldHex: string, newHex: string) => void;
}

const JOURNAL_THEMES = [
  {
    name: 'Nature',
    description: 'Slate blue and muted teal',
    fill: '#14B8A6',
    stroke: '#2B5C8F',
  },
  {
    name: 'Cell',
    description: 'Deep cyan and vivid coral',
    fill: '#F43F5E',
    stroke: '#0891B2',
  },
  {
    name: 'Monochrome',
    description: 'Print-safe grayscale',
    fill: '#CBD5E1',
    stroke: '#1E293B',
  },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  onSetFill,
  onSetStroke,
  onUpdateBioParams,
  onReplaceColor,
}) => {
  const {
    hasSelectedObject,
    selectedObjectProps,
    isPropertiesPanelOpen,
    setPropertiesPanelOpen,
  } = useEditorStore();

  if (!hasSelectedObject || !selectedObjectProps) {
    return null;
  }

  const {
    type,
    scientificMeta,
    bioType,
    membraneParams,
    dnaParams,
    arrowParams,
    extractedColors,
  } = selectedObjectProps;

  // Floating tab on right edge when collapsed to quickly expand
  if (!isPropertiesPanelOpen) {
    return (
      <aside className="absolute right-4 top-20 z-20 select-none">
        <Tooltip content={bioType ? 'Open Bio Parameters' : 'Open Details Panel'} side="left">
          <button
            type="button"
            onClick={() => setPropertiesPanelOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all"
          >
            {bioType === 'membrane' ? (
              <Layers className="w-4 h-4 text-amber-600" />
            ) : bioType === 'dna' ? (
              <Dna className="w-4 h-4 text-sky-600" />
            ) : bioType === 'arrow' ? (
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            )}
            <span>{bioType ? 'Bio Parameters' : 'Details'}</span>
          </button>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside
      style={{
        transition:
          'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="absolute right-4 top-20 z-20 w-80 max-h-[calc(100vh-6rem)] overflow-y-auto bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-3.5 flex flex-col space-y-3.5 select-none animate-in slide-in-from-right-3 duration-200"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-1.5">
          {bioType === 'membrane' ? (
            <Layers className="w-4 h-4 text-amber-600" />
          ) : bioType === 'dna' ? (
            <Dna className="w-4 h-4 text-sky-600" />
          ) : bioType === 'arrow' ? (
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          ) : (
            <Palette className="w-3.5 h-3.5 text-sky-600" />
          )}
          <span className="text-xs font-semibold text-slate-900 capitalize truncate max-w-[150px]">
            {scientificMeta ? scientificMeta.name : `${type} Parameters`}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-slate-500 uppercase font-mono px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded">
            {bioType ? 'Bio Generator' : scientificMeta ? 'Vector SVG' : type}
          </span>
          <button
            type="button"
            onClick={() => setPropertiesPanelOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Collapse panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. Contextual Bio Generator Controls                          */}
      {/* ------------------------------------------------------------- */}

      {/* A. Membrane Controls */}
      {bioType === 'membrane' && membraneParams && (
        <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-900">
              Membrane Parameters
            </span>
            <span className="text-[10px] text-amber-700 font-mono">Bilayer</span>
          </div>

          {/* Length Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Length</span>
              <span className="font-mono">{Math.round(membraneParams.length)}px</span>
            </div>
            <input
              type="range"
              min="120"
              max="700"
              step="10"
              value={membraneParams.length}
              onChange={(e) =>
                onUpdateBioParams({ length: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-600 h-1.5 cursor-pointer"
            />
          </div>

          {/* Lipid Spacing Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Lipid Spacing</span>
              <span className="font-mono">{membraneParams.spacing}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="28"
              step="1"
              value={membraneParams.spacing}
              onChange={(e) =>
                onUpdateBioParams({ spacing: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-600 h-1.5 cursor-pointer"
            />
          </div>

          {/* Curvature Slider (0 = straight, 1 = curved vesicle arc) */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Curvature (Arc)</span>
              <span className="font-mono">
                {Math.round((membraneParams.curvature || 0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={membraneParams.curvature || 0}
              onChange={(e) =>
                onUpdateBioParams({ curvature: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-600 h-1.5 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* B. DNA Double Helix Controls */}
      {bioType === 'dna' && dnaParams && (
        <div className="p-2.5 bg-sky-50/60 rounded-xl border border-sky-100/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-900">
              DNA Helix Parameters
            </span>
            <span className="text-[10px] text-sky-700 font-mono">Double Helix</span>
          </div>

          {/* Length Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Length</span>
              <span className="font-mono">{Math.round(dnaParams.length)}px</span>
            </div>
            <input
              type="range"
              min="100"
              max="700"
              step="10"
              value={dnaParams.length}
              onChange={(e) =>
                onUpdateBioParams({ length: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-600 h-1.5 cursor-pointer"
            />
          </div>

          {/* Turns Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Helical Turns</span>
              <span className="font-mono">{dnaParams.turns} turns</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={dnaParams.turns}
              onChange={(e) =>
                onUpdateBioParams({ turns: parseInt(e.target.value, 10) })
              }
              className="w-full accent-sky-600 h-1.5 cursor-pointer"
            />
          </div>

          {/* Amplitude / Diameter Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Helix Diameter</span>
              <span className="font-mono">{dnaParams.amplitude * 2}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="2"
              value={dnaParams.amplitude}
              onChange={(e) =>
                onUpdateBioParams({ amplitude: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-600 h-1.5 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* C. Pathway Connector Controls */}
      {bioType === 'arrow' && arrowParams && (
        <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-900">
              Connector Parameters
            </span>
            <span className="text-[10px] text-emerald-700 font-mono">Pathway</span>
          </div>

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
            <button
              onClick={() => onUpdateBioParams({ type: 'activation' })}
              className={`py-1 rounded-md border text-center transition-all ${
                arrowParams.type === 'activation'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Activation (→)
            </button>
            <button
              onClick={() => onUpdateBioParams({ type: 'inhibition' })}
              className={`py-1 rounded-md border text-center transition-all ${
                arrowParams.type === 'inhibition'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Inhibition (--|)
            </button>
          </div>

          {/* Length Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Length</span>
              <span className="font-mono">{Math.round(arrowParams.length)}px</span>
            </div>
            <input
              type="range"
              min="60"
              max="400"
              step="10"
              value={arrowParams.length}
              onChange={(e) =>
                onUpdateBioParams({ length: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-600 h-1.5 cursor-pointer"
            />
          </div>

          {/* Head Size Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Head / Bar Size</span>
              <span className="font-mono">{arrowParams.headSize}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              step="2"
              value={arrowParams.headSize}
              onChange={(e) =>
                onUpdateBioParams({ headSize: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-600 h-1.5 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Journal Themes Quick Palette                              */}
      {/* ------------------------------------------------------------- */}
      <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-800">Journal Themes</label>
          <span className="text-[10px] text-slate-400">Cohesive Palettes</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {JOURNAL_THEMES.map((theme) => (
            <button
              key={theme.name}
              onClick={() => {
                if (extractedColors && extractedColors.length > 1 && onReplaceColor) {
                  onReplaceColor(extractedColors[0], theme.fill);
                  if (extractedColors[1]) {
                    onReplaceColor(extractedColors[1], theme.stroke);
                  }
                } else {
                  onSetFill(theme.fill);
                  onSetStroke(theme.stroke);
                }
                if (bioType === 'membrane') {
                  onUpdateBioParams({ headColor: theme.fill, tailColor: theme.stroke });
                } else if (bioType === 'dna') {
                  onUpdateBioParams({ backboneColor: theme.stroke, strand2Color: theme.fill });
                } else if (bioType === 'arrow') {
                  onUpdateBioParams({ color: theme.stroke });
                }
              }}
              title={`${theme.name} Theme — ${theme.description}`}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white hover:border-sky-400 hover:shadow-xs transition-all flex flex-col items-center space-y-1 text-center"
            >
              <div className="flex space-x-1 items-center">
                <div
                  className="w-3 h-3 rounded-full border border-slate-200"
                  style={{ backgroundColor: theme.fill }}
                />
                <div
                  className="w-3 h-3 rounded-full border border-slate-200"
                  style={{ backgroundColor: theme.stroke }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-700">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scientific Citation / Provenance Card */}
      {scientificMeta && (
        <div className="text-[11px] bg-sky-50/50 rounded-xl p-2.5 border border-sky-100/80 space-y-1">
          <div className="flex items-center space-x-1 text-sky-800 font-semibold mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Scientific Provenance</span>
          </div>
          <p className="text-slate-600 text-[10px] leading-tight">
            Creator:{' '}
            <span className="font-medium text-slate-800">
              {scientificMeta.license?.creator || 'OpenBioFigure'}
            </span>
          </p>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="font-mono bg-sky-100 text-sky-800 px-1 py-0.2 rounded">
              {scientificMeta.license?.spdx || 'CC0-1.0'}
            </span>
            {scientificMeta.license?.sourceUrl && (
              <a
                href={scientificMeta.license.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:text-sky-800 flex items-center space-x-0.5"
              >
                <span>Source</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
