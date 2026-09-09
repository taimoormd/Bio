import React from 'react';
import {
  MousePointer,
  Hand,
  Type,
  Square,
  Circle as CircleIcon,
  Trash2,
  Sparkles,
  CloudUpload,
  Wand2,
  Shapes as ShapesIcon,
} from 'lucide-react';
import { useEditorStore, ToolType } from '../../stores/useEditorStore';
import { Tooltip } from '../ui/Tooltip';

interface ToolbarProps {
  onAddTextbox: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onDeleteSelected: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddTextbox,
  onAddRect,
  onAddCircle,
  onDeleteSelected,
}) => {
  const {
    activeTool,
    setActiveTool,
    hasSelectedObject,
    isShapesDrawerOpen,
    toggleShapesDrawer,
    isAssetDrawerOpen,
    toggleAssetDrawer,
    isUploadsDrawerOpen,
    toggleUploadsDrawer,
    isVectorizerOpen,
    openVectorizer,
    closeVectorizer,
  } = useEditorStore();

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);
  };

  return (
    <aside className="absolute left-4 top-20 z-10 flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl p-1.5 space-y-1 select-none">
      {/* Selection Tool */}
      <Tooltip content="Select Tool" shortcut="V" side="right">
        <button
          type="button"
          onClick={() => handleToolClick('select')}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === 'select'
              ? 'bg-blue-50 text-blue-600 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {activeTool === 'select' && (
            <div className="absolute left-0.5 top-2 bottom-2 w-0.5 bg-blue-600 rounded-full" />
          )}
          <MousePointer className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Pan / Hand Tool */}
      <Tooltip content="Hand / Pan Tool" shortcut="H / Space" side="right">
        <button
          type="button"
          onClick={() => handleToolClick('pan')}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === 'pan'
              ? 'bg-blue-50 text-blue-600 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {activeTool === 'pan' && (
            <div className="absolute left-0.5 top-2 bottom-2 w-0.5 bg-blue-600 rounded-full" />
          )}
          <Hand className="w-4 h-4" />
        </button>
      </Tooltip>

      <div className="h-px bg-slate-200 my-1 mx-1" />

      {/* Shapes & Connectors Drawer Toggle */}
      <Tooltip content="Shapes, Connectors & Callouts" side="right">
        <button
          type="button"
          onClick={toggleShapesDrawer}
          className={`p-2 rounded-xl transition-all ${
            isShapesDrawerOpen
              ? 'bg-blue-50 text-blue-600 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShapesIcon className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Scientific Asset Library Toggle */}
      <Tooltip content="Scientific Icons & Assets" side="right">
        <button
          type="button"
          onClick={toggleAssetDrawer}
          className={`p-2 rounded-xl transition-all ${
            isAssetDrawerOpen
              ? 'bg-blue-50 text-blue-600 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* User Uploads Panel Toggle */}
      <Tooltip content="Uploads & Media" side="right">
        <button
          type="button"
          onClick={toggleUploadsDrawer}
          className={`p-2 rounded-xl transition-all ${
            isUploadsDrawerOpen
              ? 'bg-blue-50 text-blue-600 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CloudUpload className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Trace SVG Vectorizer Toggle */}
      <Tooltip content="Trace to SVG (Vectorizer)" side="right">
        <button
          type="button"
          onClick={() => {
            if (isVectorizerOpen) {
              closeVectorizer();
            } else {
              openVectorizer();
            }
          }}
          className={`p-2 rounded-xl transition-all ${
            isVectorizerOpen
              ? 'bg-blue-50 text-blue-600 shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wand2 className="w-4 h-4" />
        </button>
      </Tooltip>

      <div className="h-px bg-slate-200 my-1 mx-1" />

      {/* Add Text Box */}
      <Tooltip content="Text Box" shortcut="T" side="right">
        <button
          type="button"
          onClick={onAddTextbox}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
        >
          <Type className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Add Rectangle Vector */}
      <Tooltip content="Rectangle Shape" shortcut="R" side="right">
        <button
          type="button"
          onClick={onAddRect}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
        >
          <Square className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Add Circle Vector */}
      <Tooltip content="Circle Shape" shortcut="C" side="right">
        <button
          type="button"
          onClick={onAddCircle}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
        >
          <CircleIcon className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Delete Object Action (Enabled when object selected) */}
      {hasSelectedObject && (
        <>
          <div className="h-px bg-slate-200 my-1 mx-1" />
          <Tooltip content="Delete Selected" shortcut="Del" side="right">
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95 animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
        </>
      )}
    </aside>
  );
};
