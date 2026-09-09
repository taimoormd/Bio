import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Shapes,
  Maximize2,
  GitCommit,
  MessageSquare,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { SHAPE_CATALOG, ShapeDefinition } from '../../engines/procedural/shapes';

interface ShapesDrawerProps {
  onInsertShape: (shapeId: string) => void;
}

type CategoryTab = 'all' | 'basic' | 'connectors' | 'annotations';

export const ShapesDrawer: React.FC<ShapesDrawerProps> = ({ onInsertShape }) => {
  const { isShapesDrawerOpen, setShapesDrawerOpen } = useEditorStore();
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShapes = useMemo(() => {
    return SHAPE_CATALOG.filter((shape) => {
      const matchesCategory =
        activeCategory === 'all' || shape.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        shape.name.toLowerCase().includes(q) ||
        shape.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <aside
      style={{
        transition:
          'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`absolute left-16 top-20 z-20 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden select-none ${
        isShapesDrawerOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : '-translate-x-8 opacity-0 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
            <Shapes className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Shapes & Tools</h2>
            <p className="text-xs text-slate-500">25+ procedural vectors & connectors</p>
          </div>
        </div>
        <button
          onClick={() => setShapesDrawerOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search shapes, arrows, brackets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 focus:bg-white text-slate-700 placeholder-slate-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex px-3 pt-2 pb-1 gap-1 border-b border-slate-100 bg-slate-50/30 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            activeCategory === 'all'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveCategory('basic')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeCategory === 'basic'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Maximize2 className="w-3 h-3" />
          Geometric
        </button>
        <button
          onClick={() => setActiveCategory('connectors')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeCategory === 'connectors'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GitCommit className="w-3 h-3" />
          Connectors
        </button>
        <button
          onClick={() => setActiveCategory('annotations')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
            activeCategory === 'annotations'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          Callouts
        </button>
      </div>

      {/* Shapes Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        {filteredShapes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
            <Shapes className="w-8 h-8 stroke-1 mb-2 opacity-40" />
            <p className="text-xs">No shapes match your query</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredShapes.map((shape) => (
              <ShapeCard
                key={shape.id}
                shape={shape}
                onSelect={() => onInsertShape(shape.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drag & Drop Hint */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Click to center or drag onto poster</span>
        <span className="font-mono text-[10px] text-slate-400 tabular-nums">
          {filteredShapes.length} shapes
        </span>
      </div>
    </aside>
  );
};

interface ShapeCardProps {
  shape: ShapeDefinition;
  onSelect: () => void;
}

const ShapeCard: React.FC<ShapeCardProps> = ({ shape, onSelect }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'procedural-shape',
        shapeId: shape.id,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <button
      onClick={onSelect}
      draggable
      onDragStart={handleDragStart}
      title={`${shape.name} (Click to insert or drag onto artboard)`}
      className="group relative flex flex-col items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-sky-50/50 hover:border-sky-300 hover:shadow-sm transition-all text-left cursor-grab active:cursor-grabbing active:scale-95"
    >
      <div className="w-12 h-12 flex items-center justify-center text-sky-600 group-hover:text-sky-700 transition-colors">
        <ShapePreviewIcon shapeId={shape.id} />
      </div>
      <span className="text-[10px] font-medium text-slate-600 group-hover:text-sky-900 truncate w-full text-center mt-1">
        {shape.name}
      </span>
    </button>
  );
};

/**
 * Clean SVG preview rendering for each procedural shape definition
 */
const ShapePreviewIcon: React.FC<{ shapeId: string }> = ({ shapeId }) => {
  const stroke = '#0284C7';
  const fill = '#E0F2FE';
  const strokeWidth = 2;

  switch (shapeId) {
    case 'rect':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <rect x="5" y="8" width="30" height="24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'rounded-rect':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <rect x="5" y="8" width="30" height="24" rx="6" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'capsule':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <rect x="3" y="12" width="34" height="16" rx="8" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <circle cx="20" cy="20" r="14" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'ellipse':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <ellipse cx="20" cy="20" rx="16" ry="11" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'semi-circle':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <path d="M 5 26 A 15 15 0 0 1 35 26 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'donut':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <path
            d="M 20 5 A 15 15 0 1 0 20 35 A 15 15 0 1 0 20 5 Z M 20 13 A 7 7 0 1 1 20 27 A 7 7 0 1 1 20 13 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fillRule="evenodd"
          />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="20,6 34,32 6,32" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'right-triangle':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="8,8 32,32 8,32" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="20,5 34,20 20,35 6,20" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'pentagon':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="20,6 34,16 29,32 11,32 6,16" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="20,5 33,12.5 33,27.5 20,35 7,27.5 7,12.5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'star-5':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon
            points="20,5 24,14 34,14 26,20 29,30 20,24 11,30 14,20 6,14 16,14"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case 'star-4':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="20,5 24,16 35,20 24,24 20,35 16,24 5,20 16,16" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'cross':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon
            points="14,6 26,6 26,14 34,14 34,26 26,26 26,34 14,34 14,26 6,26 6,14 14,14"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    case 'banner':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="4,12 36,12 31,20 36,28 4,28 9,20" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
    case 'line-solid':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <line x1="5" y1="20" x2="35" y2="20" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      );
    case 'line-dashed':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <line x1="5" y1="20" x2="35" y2="20" stroke={stroke} strokeWidth={2.5} strokeDasharray="5,3" strokeLinecap="round" />
        </svg>
      );
    case 'line-dotted':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <line x1="5" y1="20" x2="35" y2="20" stroke={stroke} strokeWidth={3} strokeDasharray="1,4" strokeLinecap="round" />
        </svg>
      );
    case 'arrow-activation':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <line x1="6" y1="20" x2="26" y2="20" stroke={stroke} strokeWidth={2.5} />
          <polygon points="26,14 35,20 26,26" fill={stroke} />
        </svg>
      );
    case 'arrow-inhibition':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <line x1="6" y1="20" x2="32" y2="20" stroke={stroke} strokeWidth={2.5} />
          <line x1="32" y1="12" x2="32" y2="28" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
        </svg>
      );
    case 'arrow-equilibrium':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <line x1="6" y1="17" x2="30" y2="17" stroke={stroke} strokeWidth={2} />
          <polyline points="25,12 32,17" stroke={stroke} strokeWidth={2} fill="none" />
          <line x1="10" y1="23" x2="34" y2="23" stroke={stroke} strokeWidth={2} />
          <polyline points="15,28 8,23" stroke={stroke} strokeWidth={2} fill="none" />
        </svg>
      );
    case 'arrow-double':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <polygon points="12,15 5,20 12,25" fill={stroke} />
          <line x1="10" y1="20" x2="30" y2="20" stroke={stroke} strokeWidth={2} />
          <polygon points="28,15 35,20 28,25" fill={stroke} />
        </svg>
      );
    case 'arrow-arc':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <path d="M 10 24 A 12 12 0 1 1 30 24" fill="none" stroke={stroke} strokeWidth={2} />
          <polygon points="26,28 32,23 34,31" fill={stroke} />
        </svg>
      );
    case 'callout-speech':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <path
            d="M 6 10 C 6 8 8 6 10 6 L 30 6 C 32 6 34 8 34 10 L 34 22 C 34 24 32 26 30 26 L 16 26 L 10 32 L 12 26 L 10 26 C 8 26 6 24 6 22 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'callout-thought':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <ellipse cx="20" cy="16" rx="14" ry="10" fill={fill} stroke={stroke} strokeWidth={1.8} />
          <circle cx="12" cy="28" r="2.5" fill={fill} stroke={stroke} strokeWidth={1.2} />
          <circle cx="8" cy="33" r="1.5" fill={fill} stroke={stroke} strokeWidth={1} />
        </svg>
      );
    case 'bracket-horizontal':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <path
            d="M 6 22 Q 13 22 13 18 L 13 15 Q 13 11 20 11 Q 27 11 27 15 L 27 18 Q 27 22 34 22"
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      );
    case 'bracket-vertical':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <path
            d="M 22 6 Q 22 13 18 13 L 15 13 Q 11 13 11 20 Q 11 27 15 27 L 18 27 Q 22 27 22 34"
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9">
          <rect x="8" y="8" width="24" height="24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
  }
};
