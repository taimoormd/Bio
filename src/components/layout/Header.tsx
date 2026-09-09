import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Columns,
  SquareDashed,
  RotateCw,
  SlidersHorizontal,
  Download,
  FileText,
  Image,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import {
  PresetKey,
  getEffectiveDimensionsMm,
} from '../../core/document/types';
import { Tooltip } from '../ui/Tooltip';

interface HeaderProps {
  onExportPdf: () => void;
  onExportPng: () => void;
  onOpenCitations: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportPdf,
  onExportPng,
  onOpenCitations,
}) => {
  const {
    documentConfig,
    showMargins,
    showColumns,
    setPreset,
    setDimensions,
    setOrientation,
    setColumns,
    toggleMargins,
    toggleColumns,
  } = useEditorStore();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const effectiveDims = getEffectiveDimensionsMm(documentConfig);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as PresetKey;
    setPreset(val);
  };

  const handleToggleOrientation = () => {
    const nextOrientation =
      documentConfig.orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(nextOrientation);
  };

  return (
    <header className="h-13 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shadow-2xs select-none z-20 shrink-0">
      {/* Brand & Document Name */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs font-bold text-xs tracking-tight">
            OBF
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-900 text-sm tracking-tight">
                OpenBioFigure
              </span>
              <span className="bg-sky-50 text-sky-700 text-[10px] font-semibold px-1.5 py-0.2 rounded-full border border-sky-200/80">
                Vector
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-none mt-0.5">
              Scientific Poster & Diagram Editor
            </p>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Preset Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1">
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={documentConfig.preset}
            onChange={handlePresetChange}
            className="text-xs font-medium text-slate-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
          >
            <option value="A0">ISO A0 Poster (841 × 1189 mm)</option>
            <option value="A1">ISO A1 Poster (594 × 841 mm)</option>
            <option value="Poster_36x48">US Poster (36 × 48 in)</option>
            <option value="Journal_1Col">Journal 1-Col (85 × 120 mm)</option>
            <option value="Journal_2Col">Journal 2-Col (175 × 150 mm)</option>
            <option value="Custom">Custom Dimensions</option>
          </select>
        </div>

        {/* Physical mm Dimensions Display */}
        <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1">
          <span className="font-mono text-slate-900 font-medium tabular-nums">
            {effectiveDims.widthMm.toFixed(1)}
          </span>
          <span className="text-slate-400">×</span>
          <span className="font-mono text-slate-900 font-medium tabular-nums">
            {effectiveDims.heightMm.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">mm</span>
        </div>

        {/* Orientation Toggle Button */}
        <Tooltip content={`Switch to ${documentConfig.orientation === 'portrait' ? 'Landscape' : 'Portrait'}`}>
          <button
            type="button"
            onClick={handleToggleOrientation}
            className="flex items-center space-x-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2 py-1 transition-colors"
          >
            <RotateCw className="w-3 h-3 text-slate-500" />
            <span className="capitalize">{documentConfig.orientation}</span>
          </button>
        </Tooltip>
      </div>

      {/* Center: Guidelines & Layout Overlays */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70">
          {/* Margin Guides Toggle */}
          <button
            type="button"
            onClick={toggleMargins}
            className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-md transition-all ${
              showMargins
                ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SquareDashed className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Margins</span>
          </button>

          {/* Column Guides Toggle */}
          <button
            type="button"
            onClick={toggleColumns}
            className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-md transition-all ${
              showColumns
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Columns ({documentConfig.columns})
            </span>
          </button>
        </div>

        {/* Layout Guides Configuration Popover Trigger */}
        <div className="relative">
          <Tooltip content="Configure Grid Columns & Margins">
            <button
              type="button"
              onClick={() => setShowConfigModal(!showConfigModal)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showConfigModal
                  ? 'bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {showConfigModal && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 z-50 text-xs animate-popover">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="font-semibold text-slate-900">Layout & Column Setup</span>
                <span className="text-[10px] text-slate-400">Scientific Grids</span>
              </div>

              {/* Columns Count */}
              <div className="mb-2.5">
                <label className="block text-slate-600 mb-1 font-medium">
                  Column Count
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColumns(col, documentConfig.columnGapMm)}
                      className={`py-1 rounded-md border font-medium text-center transition-colors ${
                        documentConfig.columns === col
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {col} {col === 1 ? 'Col' : 'Cols'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Gutter */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-medium">Gutter Gap</label>
                  <span className="font-mono text-slate-900">
                    {documentConfig.columnGapMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={documentConfig.columnGapMm}
                  onChange={(e) =>
                    setColumns(documentConfig.columns, parseFloat(e.target.value))
                  }
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              {/* Custom Dimensions if selected */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-600 mb-1 font-medium">
                  Artboard Size (mm)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Width</span>
                    <input
                      type="number"
                      value={documentConfig.widthMm}
                      onChange={(e) =>
                        setDimensions(
                          parseFloat(e.target.value) || 10,
                          documentConfig.heightMm
                        )
                      }
                      className="w-full border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Height</span>
                    <input
                      type="number"
                      value={documentConfig.heightMm}
                      onChange={(e) =>
                        setDimensions(
                          documentConfig.widthMm,
                          parseFloat(e.target.value) || 10
                        )
                      }
                      className="w-full border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Citations & Export Controls */}
      <div className="flex items-center space-x-2">
        {/* Citations Quick Button */}
        <Tooltip content="Manuscript Citations & Provenance">
          <button
            type="button"
            onClick={onOpenCitations}
            className="flex items-center space-x-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Citations</span>
          </button>
        </Tooltip>

        {/* Export Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-3 py-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-sky-200" />
          </button>

          {showExportMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-popover text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Publication Export
              </div>

              {/* Vector PDF */}
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportPdf();
                }}
                className="w-full text-left px-3 py-2 hover:bg-sky-50 flex items-start space-x-2.5 transition-colors group cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-sky-700">
                    Vector PDF (Print Ready)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Lossless vector scaling, exact mm poster format
                  </div>
                </div>
              </button>

              {/* High-Res PNG */}
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportPng();
                }}
                className="w-full text-left px-3 py-2 hover:bg-sky-50 flex items-start space-x-2.5 transition-colors group cursor-pointer"
              >
                <Image className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-700">
                    High-Res PNG (300 DPI)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sharp print-ready raster figure
                  </div>
                </div>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {/* Citations in Menu */}
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onOpenCitations();
                }}
                className="w-full text-left px-3 py-2 hover:bg-sky-50 flex items-start space-x-2.5 transition-colors group cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                    Manuscript Citations
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Academic acknowledgment paragraph
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
