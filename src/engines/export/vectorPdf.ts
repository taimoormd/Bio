import { Canvas } from 'fabric';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import {
  DocumentConfig,
  getEffectiveDimensionsMm,
  mmToPx,
} from '../../core/document/types';

export async function exportToVectorPdf(
  canvas: Canvas,
  config: DocumentConfig
): Promise<void> {
  const { widthMm, heightMm } = getEffectiveDimensionsMm(config);
  const artboardWidthPx = mmToPx(widthMm);
  const artboardHeightPx = mmToPx(heightMm);

  // 1. Commit active text editing and discard active selection
  const active = canvas.getActiveObject() as any;
  if (active?.isEditing) {
    active.exitEditing();
  }
  canvas.discardActiveObject();

  // 2. Set export guard and save current viewport transform
  (canvas as any).__isExporting = true;
  const originalVpt = canvas.viewportTransform.slice() as [number, number, number, number, number, number];

  let svgString = '';
  try {
    // 3. Reset viewport transform so artboard (0,0) is origin
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // 4. Export canvas as native SVG string clipped strictly to artboard dimensions
    svgString = canvas.toSVG({
      suppressPreamble: true,
      width: `${artboardWidthPx}px`,
      height: `${artboardHeightPx}px`,
      viewBox: {
        x: 0,
        y: 0,
        width: artboardWidthPx,
        height: artboardHeightPx,
      },
    });
  } finally {
    // 5. Always restore original canvas state
    canvas.setViewportTransform(originalVpt);
    (canvas as any).__isExporting = false;
    canvas.requestRenderAll();
  }

  // 6. Parse SVG string into a DOM element
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  // 7. Ensure poster background rect covers the entire artboard
  const artboardBg = config.backgroundColor || '#FFFFFF';
  const existingBg = svgElement.querySelector('rect[fill="#F1F3F5"], rect[fill="#E2E8F0"]');
  if (existingBg) {
    existingBg.setAttribute('fill', artboardBg);
    existingBg.setAttribute('x', '0');
    existingBg.setAttribute('y', '0');
    existingBg.setAttribute('width', `${artboardWidthPx}`);
    existingBg.setAttribute('height', `${artboardHeightPx}`);
  } else {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', `${artboardWidthPx}`);
    bgRect.setAttribute('height', `${artboardHeightPx}`);
    bgRect.setAttribute('fill', artboardBg);
    svgElement.insertBefore(bgRect, svgElement.firstChild);
  }

  // 8. Initialize jsPDF with exact physical poster dimensions
  const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  svgElement.setAttribute('width', `${pdfWidth}mm`);
  svgElement.setAttribute('height', `${pdfHeight}mm`);
  svgElement.setAttribute('viewBox', `0 0 ${artboardWidthPx} ${artboardHeightPx}`);

  // 9. Render vector SVG into PDF context using svg2pdf
  await svg2pdf(svgElement, pdf, {
    x: 0,
    y: 0,
    width: pdfWidth,
    height: pdfHeight,
  });

  // 10. Trigger download
  const filename = `scientific-poster-${config.preset.toLowerCase()}.pdf`;
  pdf.save(filename);
}
