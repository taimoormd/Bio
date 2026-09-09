import { BackgroundRemovalMode } from './types';

interface ColorBox {
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
  pixels: number[]; // indices into pixel array
}

/**
 * Preprocesses raw RGBA ImageData:
 * 1. Removes background (white, black, or none) based on Euclidean color distance and tolerance (0-100).
 * 2. Optionally quantizes non-transparent pixels to `colorCount` colors (2 to 16) using median-cut.
 */
export function preprocessImageData(
  imageData: ImageData,
  mode: BackgroundRemovalMode,
  tolerance: number,
  colorCount?: number
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);

  // 1. Background Removal
  if (mode !== 'none') {
    // Max distance scaling: at tolerance 100, maxDistance is 220 (removes light grays/shadows)
    const maxDist = (Math.min(Math.max(tolerance, 0), 100) / 100) * 220;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let dist = 0;
      if (mode === 'white') {
        dist = Math.hypot(255 - r, 255 - g, 255 - b);
      } else if (mode === 'black') {
        dist = Math.hypot(r, g, b);
      }

      if (dist <= maxDist) {
        data[i + 3] = 0; // Transparent
      }
    }
  }

  // 2. Color Quantization (2 to 16 colors)
  if (colorCount && colorCount >= 2 && colorCount <= 16) {
    quantizeColors(data, colorCount);
  }

  return new ImageData(data, width, height);
}

/**
 * Median-cut color quantization algorithm for non-transparent pixels.
 */
function quantizeColors(data: Uint8ClampedArray, targetCount: number): void {
  // Collect non-transparent pixel indices
  const nonTransparentIndices: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 10) {
      nonTransparentIndices.push(i);
    }
  }

  if (nonTransparentIndices.length === 0) return;

  // Build initial bounding box
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const idx of nonTransparentIndices) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }

  const initialBox: ColorBox = {
    rMin, rMax, gMin, gMax, bMin, bMax,
    pixels: nonTransparentIndices,
  };

  const boxes: ColorBox[] = [initialBox];

  // Split boxes until we reach targetCount or cannot split further
  while (boxes.length < targetCount) {
    // Find box with greatest channel span
    let bestIdx = -1;
    let maxSpan = -1;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.pixels.length <= 1) continue;
      const rSpan = box.rMax - box.rMin;
      const gSpan = box.gMax - box.gMin;
      const bSpan = box.bMax - box.bMin;
      const span = Math.max(rSpan, gSpan, bSpan);
      if (span > maxSpan) {
        maxSpan = span;
        bestIdx = i;
      }
    }

    if (bestIdx === -1 || maxSpan <= 1) break;

    const boxToSplit = boxes.splice(bestIdx, 1)[0];
    const rSpan = boxToSplit.rMax - boxToSplit.rMin;
    const gSpan = boxToSplit.gMax - boxToSplit.gMin;
    const bSpan = boxToSplit.bMax - boxToSplit.bMin;

    // Sort along widest channel
    const channel = rSpan >= gSpan && rSpan >= bSpan ? 0 : gSpan >= bSpan ? 1 : 2;
    boxToSplit.pixels.sort((a, b) => data[a + channel] - data[b + channel]);

    const mid = Math.floor(boxToSplit.pixels.length / 2);
    const p1 = boxToSplit.pixels.slice(0, mid);
    const p2 = boxToSplit.pixels.slice(mid);

    boxes.push(computeBounds(p1, data));
    boxes.push(computeBounds(p2, data));
  }

  // Calculate representative average color for each box
  const palette: [number, number, number][] = [];
  for (const box of boxes) {
    let rSum = 0, gSum = 0, bSum = 0;
    for (const idx of box.pixels) {
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
    }
    const count = box.pixels.length || 1;
    const avgR = Math.round(rSum / count);
    const avgG = Math.round(gSum / count);
    const avgB = Math.round(bSum / count);
    palette.push([avgR, avgG, avgB]);

    // Map box pixels to average color
    for (const idx of box.pixels) {
      data[idx] = avgR;
      data[idx + 1] = avgG;
      data[idx + 2] = avgB;
    }
  }
}

function computeBounds(pixels: number[], data: Uint8ClampedArray): ColorBox {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const idx of pixels) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }
  return { rMin, rMax, gMin, gMax, bMin, bMax, pixels };
}
