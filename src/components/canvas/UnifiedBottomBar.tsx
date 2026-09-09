import React from 'react';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Minus,
  Maximize2,
} from 'lucide-react';
import { DocumentConfig, getEffectiveDimensionsMm, DocumentPage } from '../../core/document/types';
import { Tooltip } from '../ui/Tooltip';

interface UnifiedBottomBarProps {
  pages: DocumentPage[];
  activePageIndex: number;
  zoomPercent: number;
  documentConfig: DocumentConfig;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onResetZoom: () => void;
}

export const UnifiedBottomBar: React.FC<UnifiedBottomBarProps> = ({
  pages,
  activePageIndex,
  zoomPercent,
  documentConfig,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onResetZoom,
}) => {
  const { widthMm, heightMm } = getEffectiveDimensionsMm(documentConfig);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-2xl p-1.5 space-x-2 select-none pointer-events-auto max-w-[calc(100vw-360px)] transition-all">
      {/* 1. Left: Figures Indicator & Figure Chips */}
      <div className="flex items-center space-x-1 px-1.5 text-slate-400">
        <FileText className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Figures
        </span>
      </div>

      <div className="flex items-center space-x-1 overflow-x-auto max-w-[180px] sm:max-w-xs md:max-w-sm">
        {pages.map((page, index) => {
          const isActive = index === activePageIndex;
          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(index)}
              className={`group relative flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <span className="tabular-nums font-mono text-[11px] opacity-75">
                {index + 1}.
              </span>
              <span className="truncate max-w-[75px]">{page.name}</span>

              {/* Duplicate & Delete Actions */}
              <div
                className={`flex items-center space-x-0.5 ml-1 transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  title="Duplicate Figure"
                  onClick={() => onDuplicatePage(index)}
                  className={`p-0.5 rounded hover:scale-110 active:scale-90 transition-transform ${
                    isActive
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                </button>

                {pages.length > 1 && (
                  <button
                    type="button"
                    title="Delete Figure"
                    onClick={() => onDeletePage(index)}
                    className={`p-0.5 rounded hover:scale-110 active:scale-90 transition-transform ${
                      isActive
                        ? 'text-slate-400 hover:text-rose-300'
                        : 'text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Center: + Add Page Button */}
      <Tooltip content="Add Figure Page" side="top">
        <button
          type="button"
          onClick={onAddPage}
          className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-xl border border-dashed border-teal-300 hover:border-teal-500 active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </Tooltip>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* 3. Center/Right: Physical Dimensions Badge */}
      <div className="hidden md:flex items-center space-x-1 text-xs text-slate-600 font-medium px-1">
        <span className="font-semibold text-slate-800">{documentConfig.preset}</span>
        <span className="text-slate-300">•</span>
        <span className="tabular-nums font-mono text-[11px] text-slate-500">
          {widthMm} × {heightMm} mm
        </span>
      </div>

      <div className="hidden md:block w-px h-5 bg-slate-200" />

      {/* 4. Right: Zoom Controls */}
      <div className="flex items-center space-x-0.5">
        <Tooltip content="Zoom Out" shortcut="Ctrl+-" side="top">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content="Reset Zoom" shortcut="100%" side="top">
          <button
            type="button"
            onClick={onResetZoom}
            className="px-1.5 py-0.5 text-xs font-semibold font-mono text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg tabular-nums active:scale-95 transition-all min-w-[38px] text-center"
          >
            {zoomPercent}%
          </button>
        </Tooltip>

        <Tooltip content="Zoom In" shortcut="Ctrl++" side="top">
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* 5. Right: Fit to Screen */}
      <Tooltip content="Fit to Screen" shortcut="Shift+1" side="top">
        <button
          type="button"
          onClick={onFitToScreen}
          className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
        >
          <Maximize2 className="w-3.5 h-3.5 mr-0.5" />
          <span>Fit</span>
        </button>
      </Tooltip>
    </div>
  );
};
