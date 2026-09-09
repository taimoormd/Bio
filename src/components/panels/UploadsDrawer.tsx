import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Shapes,
  Wand2,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  StoredImage,
  StoredVector,
  getImages,
  saveImage,
  deleteImage,
  getVectors,
  saveVector,
  deleteVector,
} from '../../core/storage/uploadStorage';
import { useEditorStore } from '../../stores/useEditorStore';

interface UploadsDrawerProps {
  onInsertImage: (image: StoredImage) => void;
  onInsertVector: (vector: StoredVector) => void;
}

export const UploadsDrawer: React.FC<UploadsDrawerProps> = ({
  onInsertImage,
  onInsertVector,
}) => {
  const {
    isUploadsDrawerOpen,
    setUploadsDrawerOpen,
    openVectorizer,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<'images' | 'vectors'>('images');
  const [images, setImages] = useState<StoredImage[]>([]);
  const [vectors, setVectors] = useState<StoredVector[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stored uploads on mount and when drawer opens
  const refreshStorage = async () => {
    try {
      const [storedImgs, storedVecs] = await Promise.all([
        getImages(),
        getVectors(),
      ]);
      setImages(storedImgs);
      setVectors(storedVecs);
    } catch (err) {
      console.error('Failed to load uploads from storage:', err);
    }
  };

  useEffect(() => {
    if (isUploadsDrawerOpen) {
      refreshStorage();
    }
  }, [isUploadsDrawerOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

        if (isSvg) {
          const text = await file.text();
          const newVector: StoredVector = {
            id: `vec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            svgString: text,
            createdAt: Date.now(),
            isConverted: false,
          };
          await saveVector(newVector);
        } else {
          // Raster image
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Compute natural image dimensions
          const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ width: 300, height: 300 });
            img.src = dataUrl;
          });

          const newImage: StoredImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl,
            createdAt: Date.now(),
            width: dimensions.width,
            height: dimensions.height,
          };
          await saveImage(newImage);
        }
      }

      await refreshStorage();
    } catch (err) {
      console.error('Failed to process upload:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteImage(id);
      startTransition(() => {
        setImages((prev) => prev.filter((img) => img.id !== id));
      });
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleDeleteVector = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteVector(id);
      startTransition(() => {
        setVectors((prev) => prev.filter((vec) => vec.id !== id));
      });
    } catch (err) {
      console.error('Failed to delete vector:', err);
    }
  };

  const handleTraceImage = (e: React.MouseEvent, image: StoredImage) => {
    e.stopPropagation();
    openVectorizer({ dataUrl: image.dataUrl, name: image.name });
  };

  const handleImageDragStart = (e: React.DragEvent, image: StoredImage) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'stored-image', dataUrl: image.dataUrl, name: image.name })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleVectorDragStart = (e: React.DragEvent, vector: StoredVector) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'stored-vector', svgString: vector.svgString, name: vector.name })
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
        isUploadsDrawerOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : '-translate-x-8 opacity-0 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-sky-50 text-sky-600">
            <Upload className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800">Media Uploads</span>
        </div>

        <button
          onClick={() => setUploadsDrawerOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close Uploads"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Media Action Button */}
      <div className="p-3 pb-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white text-xs font-medium shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading Media...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Media</span>
            </>
          )}
        </button>
      </div>

      {/* Segmented Control / Tabs */}
      <div className="px-3 pt-1 pb-2">
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 py-1 px-2 rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'images'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 tabular-nums">
              {images.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('vectors')}
            className={`flex-1 py-1 px-2 rounded-md transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'vectors'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Vectors</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 tabular-nums">
              {vectors.length}
            </span>
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-3 pt-1">
        {activeTab === 'images' ? (
          images.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">No images uploaded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, or WEBP up to publication grade
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, img)}
                  onClick={() => onInsertImage(img)}
                  title={`Click or drag to place ${img.name}`}
                  className="group relative flex flex-col items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-white hover:border-sky-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className="w-full h-24 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="w-full h-full object-contain pointer-events-none"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-1.5 w-full text-[11px] font-medium text-slate-800 truncate text-center">
                    {img.name}
                  </p>

                  {/* Hover Quick Actions */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleTraceImage(e, img)}
                      title="Trace to Vector SVG"
                      className="p-1 rounded-md bg-white/90 text-sky-600 hover:bg-sky-50 shadow-xs border border-slate-200 hover:border-sky-300 transition-all"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteImage(e, img.id)}
                      title="Delete Upload"
                      className="p-1 rounded-md bg-white/90 text-rose-600 hover:bg-rose-50 shadow-xs border border-slate-200 hover:border-rose-300 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Vectors Tab */
          vectors.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Shapes className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">No vector graphics saved</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload SVGs or trace raster images into vectors
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {vectors.map((vec) => (
                <div
                  key={vec.id}
                  draggable
                  onDragStart={(e) => handleVectorDragStart(e, vec)}
                  onClick={() => onInsertVector(vec)}
                  title={`Click or drag to insert ${vec.name}`}
                  className="group relative flex flex-col items-center justify-between p-2 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                >
                  <div
                    className="w-full h-24 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center p-2"
                    dangerouslySetInnerHTML={{ __html: vec.svgString }}
                  />
                  <div className="mt-1.5 w-full flex items-center justify-between">
                    <p className="text-[11px] font-medium text-slate-800 truncate">
                      {vec.name}
                    </p>
                    {vec.isConverted && (
                      <span className="inline-flex items-center space-x-0.5 text-[9px] font-medium px-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0 ml-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Traced</span>
                      </span>
                    )}
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteVector(e, vec.id)}
                      title="Delete Vector"
                      className="p-1 rounded-md bg-white/90 text-rose-600 hover:bg-rose-50 shadow-xs border border-slate-200 hover:border-rose-300 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer Hint */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/80 text-[10px] text-slate-500 text-center">
        Click to insert or drag onto artboard
      </div>
    </aside>
  );
};
