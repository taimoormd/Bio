import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Tag,
  ShieldCheck,
  Dna,
  Layers,
  ArrowRight,
  MinusCircle,
  FlaskConical,
} from 'lucide-react';
import {
  ScientificAssetMeta,
  CATALOG_CATEGORIES,
  CatalogCategory,
} from '../../core/catalog/catalogTypes';
import { useEditorStore } from '../../stores/useEditorStore';

interface AssetLibraryProps {
  onInsertAsset: (asset: ScientificAssetMeta) => void;
  onInsertGenerator: (type: 'membrane' | 'dna' | 'activation' | 'inhibition') => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onInsertAsset,
  onInsertGenerator,
}) => {
  const { isAssetDrawerOpen, setAssetDrawerOpen } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'icons' | 'generators'>('icons');
  const [assets, setAssets] = useState<ScientificAssetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory>('All');

  // Load catalog manifest
  useEffect(() => {
    fetch('/catalog/manifest.json')
      .then((res) => res.json())
      .then((data: ScientificAssetMeta[]) => {
        setAssets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load asset catalog:', err);
        setLoading(false);
      });
  }, []);

  const [visibleCount, setVisibleCount] = useState(50);

  // Reset visible slice when search query or category changes
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, selectedCategory]);

  // Fast tokenized search across name, category, and tags
  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];

    return assets.filter((asset) => {
      const matchesCategory =
        selectedCategory === 'All' || asset.category === selectedCategory;
      if (!matchesCategory) return false;

      if (tokens.length === 0) return true;

      const nameLower = asset.name.toLowerCase();
      const catLower = asset.category.toLowerCase();
      const tagsStr = asset.tags ? asset.tags.join(' ').toLowerCase() : '';

      return tokens.every(
        (token) =>
          nameLower.includes(token) ||
          catLower.includes(token) ||
          tagsStr.includes(token)
      );
    });
  }, [assets, searchQuery, selectedCategory]);

  const displayedAssets = useMemo(() => {
    return filteredAssets.slice(0, visibleCount);
  }, [filteredAssets, visibleCount]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 350) {
      if (visibleCount < filteredAssets.length) {
        setVisibleCount((prev) => Math.min(prev + 40, filteredAssets.length));
      }
    }
  };

  const handleAssetDragStart = (e: React.DragEvent, asset: ScientificAssetMeta) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleGeneratorDragStart = (
    e: React.DragEvent,
    type: 'membrane' | 'dna' | 'activation' | 'inhibition'
  ) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ isProcedural: true, generatorType: type })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      style={{
        transition:
          'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`absolute left-16 top-16 bottom-4 z-30 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden select-none ${
        isAssetDrawerOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : '-translate-x-8 opacity-0 pointer-events-none'
      }`}
    >
      {/* Drawer Header & Tab Switcher */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('icons')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'icons'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Icons</span>
          </button>
          <button
            onClick={() => setActiveTab('generators')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'generators'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Bio Tools</span>
          </button>
        </div>

        <button
          onClick={() => setAssetDrawerOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'icons' ? (
        <>
          {/* Search Input */}
          <div className="px-3 pt-2.5 pb-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search cells, DNA, organs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="px-3 py-1.5 flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-slate-100">
            {CATALOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Asset Grid */}
          <div
            className="flex-1 overflow-y-auto p-3"
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                Loading vector icons...
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-400 px-4 text-center">
                <Tag className="w-6 h-6 mb-1 text-slate-300" />
                <span>No matching icons found</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {displayedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => handleAssetDragStart(e, asset)}
                      onClick={() => onInsertAsset(asset)}
                      title={`Click or drag to add ${asset.name}`}
                      className="group relative flex flex-col items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-sky-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-center"
                    >
                      <div className="w-14 h-14 flex items-center justify-center p-1 rounded-lg bg-slate-50 group-hover:bg-sky-50/50 transition-colors">
                        <img
                          src={
                            asset.svgPath.startsWith('/catalog/')
                              ? asset.svgPath
                              : asset.svgPath.startsWith('/svg/')
                              ? `/catalog${asset.svgPath}`
                              : `/catalog/${asset.svgPath.replace(/^\/+/, '')}`
                          }
                          alt={asset.name}
                          className="w-full h-full object-contain pointer-events-none"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.asset-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'asset-fallback text-slate-400 font-bold text-xs uppercase tracking-tight';
                              fallback.innerText = asset.name.slice(0, 3);
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                      <div className="mt-1.5 w-full">
                        <p className="text-[11px] font-medium text-slate-800 truncate">
                          {asset.name}
                        </p>
                        <span className="text-[9px] text-slate-400 uppercase tracking-tight">
                          {asset.category}
                        </span>
                      </div>
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{asset.license.spdx}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 py-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                  Showing {displayedAssets.length} of {filteredAssets.length} icons
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* Bio Generators Tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="mb-1">
            <span className="text-[11px] font-semibold text-slate-900">
              Parametric Biology Generators
            </span>
            <p className="text-[10px] text-slate-500">
              Mathematically rendered vector structures with live parametric controls.
            </p>
          </div>

          {/* 1. Phospholipid Bilayer */}
          <div
            draggable
            onDragStart={(e) => handleGeneratorDragStart(e, 'membrane')}
            onClick={() => onInsertGenerator('membrane')}
            title="Click or drag to insert Phospholipid Bilayer"
            className="group p-3 rounded-xl border border-slate-200/80 bg-white hover:border-amber-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Phospholipid Bilayer
                </h3>
                <p className="text-[10px] text-slate-500">Dual leaflet cell membrane</p>
              </div>
            </div>
            {/* Visual Mini Preview */}
            <div className="h-10 bg-amber-50/50 rounded-lg flex items-center justify-center px-4 border border-amber-100">
              <div className="flex space-x-1.5 items-center">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="w-0.5 h-2.5 bg-amber-600 my-0.5" />
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. DNA Double Helix */}
          <div
            draggable
            onDragStart={(e) => handleGeneratorDragStart(e, 'dna')}
            onClick={() => onInsertGenerator('dna')}
            title="Click or drag to insert DNA Double Helix"
            className="group p-3 rounded-xl border border-slate-200/80 bg-white hover:border-sky-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                <Dna className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                  DNA Double Helix
                </h3>
                <p className="text-[10px] text-slate-500">Sine-wave backbones & base pairs</p>
              </div>
            </div>
            {/* Visual Mini Preview */}
            <div className="h-10 bg-sky-50/50 rounded-lg flex items-center justify-center px-4 border border-sky-100">
              <svg viewBox="0 0 160 28" className="w-full h-full text-sky-600">
                <path
                  d="M 10 14 Q 30 2 50 14 T 90 14 T 130 14 T 150 14"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2"
                />
                <path
                  d="M 10 14 Q 30 26 50 14 T 90 14 T 130 14 T 150 14"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2"
                />
                <line x1="30" y1="4" x2="30" y2="24" stroke="#F59E0B" strokeWidth="1.5" />
                <line x1="70" y1="4" x2="70" y2="24" stroke="#10B981" strokeWidth="1.5" />
                <line x1="110" y1="4" x2="110" y2="24" stroke="#EF4444" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* 3. Scientific Pathway Connectors */}
          <div className="pt-1 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Pathway Connectors
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Activation Arrow */}
              <div
                draggable
                onDragStart={(e) => handleGeneratorDragStart(e, 'activation')}
                onClick={() => onInsertGenerator('activation')}
                title="Click or drag Activation Arrow"
                className="group p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-400 hover:shadow-md transition-all cursor-grab text-center flex flex-col items-center justify-center space-y-1.5"
              >
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-800 group-hover:text-emerald-700">
                    Activation
                  </h4>
                  <span className="text-[9px] text-slate-400">Directional (→)</span>
                </div>
              </div>

              {/* Inhibition Bar */}
              <div
                draggable
                onDragStart={(e) => handleGeneratorDragStart(e, 'inhibition')}
                onClick={() => onInsertGenerator('inhibition')}
                title="Click or drag Inhibition Bar"
                className="group p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-rose-400 hover:shadow-md transition-all cursor-grab text-center flex flex-col items-center justify-center space-y-1.5"
              >
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <MinusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-800 group-hover:text-rose-700">
                    Inhibition
                  </h4>
                  <span className="text-[9px] text-slate-400">Repression (--|)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Instructions */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/80 text-[10px] text-slate-500 text-center flex items-center justify-center space-x-1">
        <span>Click to insert or drag onto artboard</span>
      </div>
    </aside>
  );
};
