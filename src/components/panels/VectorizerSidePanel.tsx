import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wand2,
  X,
  Upload,
  Check,
  Download,
  PlusCircle,
  Bookmark,
  Loader2,
  Sliders,
} from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { BackgroundRemovalMode, VectorizeResult } from '../../engines/vectorizer/types';
import { loadImageData, traceImage } from '../../engines/vectorizer/traceEngine';
import { saveVector } from '../../core/storage/uploadStorage';

interface VectorizerSidePanelProps {
  onInsertToCanvas: (svgString: string) => void;
}

export const VectorizerSidePanel: React.FC<VectorizerSidePanelProps> = ({
  onInsertToCanvas,
}) => {
  const {
    isVectorizerOpen,
    closeVectorizer,
    vectorizerInputImage,
    openVectorizer,
  } = useEditorStore();

  // Settings state
  const [bgMode, setBgMode] = useState<BackgroundRemovalMode>('white');
  const [tolerance, setTolerance] = useState<number>(85);
  const [colorCount, setColorCount] = useState<number>(8);

  // Tracing runtime state
  const [currentImageData, setCurrentImageData] = useState<ImageData | null>(null);
  const [vectorResult, setVectorResult] = useState<VectorizeResult | null>(null);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load image when input changes
  useEffect(() => {
    if (!vectorizerInputImage?.dataUrl) {
      setCurrentImageData(null);
      setVectorResult(null);
      return;
    }

    let isMounted = true;
    loadImageData(vectorizerInputImage.dataUrl)
      .then((data) => {
        if (isMounted) {
          setCurrentImageData(data);
          setIsSaved(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load image for vectorizer:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [vectorizerInputImage]);

  // Execute trace with debouncing
  const runTracing = useCallback(() => {
    if (!currentImageData) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsTracing(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await traceImage(currentImageData, {
          backgroundMode: bgMode,
          backgroundTolerance: tolerance,
          colorCount,
        });
        setVectorResult(result);
      } catch (err) {
        console.error('Error during vector tracing:', err);
      } finally {
        setIsTracing(false);
      }
    }, 120);
  }, [currentImageData, bgMode, tolerance, colorCount]);

  useEffect(() => {
    if (currentImageData) {
      runTracing();
    }
  }, [currentImageData, bgMode, tolerance, colorCount, runTracing]);

  if (!isVectorizerOpen) {
    return null;
  }

  // Handle local file drop or selection
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        openVectorizer({
          dataUrl,
          name: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInsert = () => {
    if (!vectorResult?.svgString) return;
    onInsertToCanvas(vectorResult.svgString);
  };

  const handleSaveToMySvgs = async () => {
    if (!vectorResult?.svgString) return;
    try {
      const name = (vectorizerInputImage?.name || 'Traced Vector') + ' (Traced)';
      await saveVector({
        id: `vec-traced-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        svgString: vectorResult.svgString,
        createdAt: Date.now(),
        isConverted: true,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save traced vector:', err);
    }
  };

  const handleDownloadSvg = () => {
    if (!vectorResult?.svgString) return;
    const blob = new Blob([vectorResult.svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vectorizerInputImage?.name || 'traced-vector'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      style={{
        transition:
          'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`absolute right-4 top-16 bottom-4 z-30 w-96 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden select-none ${
        isVectorizerOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-8 opacity-0 pointer-events-none'
      }`}
    >
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-sky-50 text-sky-600">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-900">Vectorize Image</h2>
            <p className="text-[10px] text-slate-400">High-fidelity raster-to-SVG tracer</p>
          </div>
        </div>

        <button
          onClick={closeVectorizer}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close Vectorizer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />

        {/* Live SVG Preview Box with Checkered Transparency Grid */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`relative w-full h-56 rounded-xl border flex items-center justify-center overflow-hidden transition-all ${
            isDraggingOver
              ? 'border-sky-500 bg-sky-50/30'
              : 'border-slate-200/90 bg-white'
          }`}
          style={{
            backgroundImage:
              'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          }}
        >
          {vectorResult ? (
            <div
              className="w-full h-full p-4 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: vectorResult.svgString }}
            />
          ) : vectorizerInputImage ? (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              <span className="text-xs">Generating vector paths...</span>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <div className="p-3 rounded-full bg-slate-100 text-slate-500 mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Choose or drop an image</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG, or WEBP to trace into scalable vector paths
              </p>
            </div>
          )}

          {/* Tracing Status Spinner Overlay */}
          {isTracing && (
            <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 px-2 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs text-[10px] text-slate-600 font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
              <span>Tracing...</span>
            </div>
          )}

          {/* Quick Swap Image Pill */}
          {vectorizerInputImage && (
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change Source Image"
              className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-md bg-white/90 hover:bg-white text-[10px] font-medium text-slate-600 border border-slate-200/80 shadow-xs hover:text-slate-900 transition-all"
            >
              Replace Image
            </button>
          )}
        </div>

        {/* Vectorization Controls */}
        <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
          {/* Background Removal Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                <Sliders className="w-3 h-3 text-slate-400" />
                <span>Background Removal</span>
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              {(['white', 'black', 'none'] as BackgroundRemovalMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBgMode(mode)}
                  className={`flex-1 py-1 px-2 rounded-md capitalize transition-all ${
                    bgMode === mode
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Tolerance Slider (Active when bgMode is not 'none') */}
          {bgMode !== 'none' && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Removal Tolerance</span>
                <span className="font-mono text-slate-700 font-semibold tabular-nums">
                  {tolerance}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
            </div>
          )}

          {/* Color Palette Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Color Palette</span>
              <span className="font-mono text-slate-700 font-semibold tabular-nums">
                {colorCount} colors
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={colorCount}
              onChange={(e) => setColorCount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-slate-100 bg-white space-y-2">
        {/* Primary Insert Button */}
        <button
          onClick={handleInsert}
          disabled={!vectorResult}
          className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:pointer-events-none"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Insert to Canvas</span>
        </button>

        {/* Secondary & Outline Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSaveToMySvgs}
            disabled={!vectorResult}
            className="py-1.5 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 active:scale-[0.98] text-indigo-700 text-xs font-medium border border-indigo-200 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Saved!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save to My SVGs</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSvg}
            disabled={!vectorResult}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 text-xs font-medium transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download .SVG</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
