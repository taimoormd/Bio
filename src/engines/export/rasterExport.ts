import { Canvas } from 'fabric';
import {
  DocumentConfig,
  getEffectiveDimensionsMm,
  mmToPx,
} from '../../core/document/types';

export async function exportToHighResPng(
  canvas: Canvas,
  config: DocumentConfig,
  dpi = 300
): Promise<void> {
  const { widthMm, heightMm } = getEffectiveDimensionsMm(config);
  const artboardWidthPx = Math.round(mmToPx(widthMm));
  const artboardHeightPx = Math.round(mmToPx(heightMm));

  // 96 DPI baseline to target DPI
  const standardMultiplier = dpi / 96;

  // Clamp multiplier to prevent exceeding browser canvas memory/dimension ceilings (max 12,000px)
  const maxDim = Math.max(artboardWidthPx, artboardHeightPx);
  const maxAllowedMultiplier = 12000 / maxDim;
  const multiplier = Math.min(standardMultiplier, Math.max(1, maxAllowedMultiplier));

  // 1. Commit active text editing and discard active selection
  const active = canvas.getActiveObject() as any;
  if (active?.isEditing) {
    active.exitEditing();
  }
  canvas.discardActiveObject();

  // 2. Set export guard and save current viewport transform & background
  (canvas as any).__isExporting = true;
  const originalVpt = canvas.viewportTransform.slice() as [number, number, number, number, number, number];
  const originalBg = canvas.backgroundColor;

  let dataUrl = '';
  try {
    // 3. Reset viewport transform to identity so artboard (0,0) is origin and scale is 1
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.backgroundColor = config.backgroundColor || '#FFFFFF';

    // 4. Export strictly cropped to the physical artboard boundary
    dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier,
      left: 0,
      top: 0,
      width: artboardWidthPx,
      height: artboardHeightPx,
      filter: (obj: any) => !obj.excludeFromExport,
    });
  } finally {
    // 5. Always restore original state
    canvas.backgroundColor = originalBg;
    canvas.setViewportTransform(originalVpt);
    (canvas as any).__isExporting = false;
    canvas.requestRenderAll();
  }

  // 6. Trigger download
  const filename = `scientific-poster-${config.preset.toLowerCase()}-300dpi.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
