import initVTracer, { to_svg } from 'vtracer-wasm';
import { VectorizerOptions, VectorizeResult } from './types';
import { preprocessImageData } from './transparentPreprocessor';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureVTracerInitialized(): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      // Load wasm from public/wasm directory
      await initVTracer({ module_or_path: '/wasm/vtracer.wasm' });
      isInitialized = true;
    })();
  }
  await initPromise;
}

/**
 * Load an image from dataURL into an ImageData object, scaling down if larger than maxDimension
 * to keep live in-browser tracing snappy and responsive.
 */
export async function loadImageData(dataUrl: string, maxDimension = 640): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (Math.max(w, h) > maxDimension) {
        const scale = maxDimension / Math.max(w, h);
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(ctx.getImageData(0, 0, w, h));
    };
    img.onerror = () => reject(new Error('Failed to load image source'));
    img.src = dataUrl;
  });
}

/**
 * Preprocess raster image data and execute in-browser VTracer vectorization.
 */
export async function traceImage(
  imageData: ImageData,
  options: VectorizerOptions
): Promise<VectorizeResult> {
  await ensureVTracerInitialized();

  // 1. Preprocess with background removal and palette quantization
  const preprocessed = preprocessImageData(
    imageData,
    options.backgroundMode,
    options.backgroundTolerance,
    options.colorCount
  );

  const width = preprocessed.width;
  const height = preprocessed.height;

  // Convert Uint8ClampedArray to Uint8Array for vtracer wasm bindings
  const rawBytes = new Uint8Array(preprocessed.data.buffer);

  // 2. Build VTracer configuration
  const config = {
    binary: false,
    mode: 'spline',
    hierarchical: 'stacked',
    filterSpeckle: options.filterSpeckle ?? 4,
    colorPrecision: Math.min(8, Math.max(2, Math.round(options.colorCount / 2) + 2)),
    layerDifference: 16,
    cornerThreshold: 60,
    lengthThreshold: 4,
    maxIterations: 10,
    spliceThreshold: 45,
    pathPrecision: options.pathPrecision ?? 3,
  };

  // 3. Execute WASM tracing
  let rawSvg = to_svg(rawBytes, width, height, config);

  // 4. Sanitize and ensure standard viewBox
  if (!rawSvg.includes('viewBox')) {
    rawSvg = rawSvg.replace(
      /<svg\b([^>]*)>/,
      `<svg viewBox="0 0 ${width} ${height}"$1>`
    );
  }

  // Ensure xmlns is present
  if (!rawSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    rawSvg = rawSvg.replace(
      /<svg\b/,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  return {
    svgString: rawSvg,
    width,
    height,
    colorCount: options.colorCount,
  };
}
