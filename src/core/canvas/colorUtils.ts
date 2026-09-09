import { Color, FabricObject, Group } from 'fabric';

/**
 * Normalizes any color representation (hex, rgb, rgba, named CSS color)
 * into a clean, lowercase 6-digit hex string (e.g. '#0891b2').
 * Returns null for 'none', 'transparent', zero-alpha, or invalid values.
 */
export function normalizeToHex(color: string | null | undefined | any): string | null {
  if (!color || typeof color !== 'string') return null;
  const trimmed = color.trim().toLowerCase();
  if (
    trimmed === '' ||
    trimmed === 'none' ||
    trimmed === 'transparent' ||
    trimmed === 'rgba(0, 0, 0, 0)' ||
    trimmed === 'rgba(0,0,0,0)' ||
    trimmed === 'inherit'
  ) {
    return null;
  }

  try {
    const fabricColor = new Color(trimmed);
    if (fabricColor.getAlpha() === 0) return null;
    const hex = fabricColor.toHex().toLowerCase();
    // Validate that hex is a valid 6-char hex
    if (/^[0-9a-f]{6}$/.test(hex)) {
      return `#${hex}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Recursively extracts all unique, visible fill and stroke colors
 * present in an SVG object or Group tree.
 * Returns up to maxColors distinct lowercase 6-digit hex codes.
 */
export function extractSvgPalette(fabricObject: FabricObject, maxColors = 12): string[] {
  const colorsSet = new Set<string>();

  function traverse(obj: FabricObject) {
    if (!obj || obj.visible === false) return;

    // If Group, traverse children only (skipping Group container's default prototype fill)
    if (obj instanceof Group || (obj as any)._objects) {
      const children: FabricObject[] =
        typeof (obj as Group).getObjects === 'function'
          ? (obj as Group).getObjects()
          : (obj as any)._objects || [];
      for (const child of children) {
        traverse(child);
      }
      return;
    }

    // Check fill on leaf vector object
    if (obj.fill && typeof obj.fill === 'string') {
      const fillHex = normalizeToHex(obj.fill);
      if (fillHex) {
        colorsSet.add(fillHex);
      }
    }

    // Check stroke on leaf vector object
    if (obj.stroke && typeof obj.stroke === 'string' && (obj.strokeWidth || 0) > 0) {
      const strokeHex = normalizeToHex(obj.stroke);
      if (strokeHex) {
        colorsSet.add(strokeHex);
      }
    }
  }

  traverse(fabricObject);
  return Array.from(colorsSet).slice(0, maxColors);
}

/**
 * Selectively replaces a specific color channel across an object or Group tree.
 * Any fill or stroke matching oldHex is updated to newHex without flattening
 * or altering the rest of the graphic.
 * Returns true if any color was replaced.
 */
export function replaceColorInObject(
  fabricObject: FabricObject,
  oldHex: string,
  newHex: string
): boolean {
  const normOld = normalizeToHex(oldHex);
  const normNew = normalizeToHex(newHex) || newHex.toLowerCase();
  if (!normOld || !normNew || normOld === normNew) return false;

  let changed = false;

  function traverse(obj: FabricObject) {
    if (!obj) return;

    // If Group, traverse children only
    if (obj instanceof Group || (obj as any)._objects) {
      const children: FabricObject[] =
        typeof (obj as Group).getObjects === 'function'
          ? (obj as Group).getObjects()
          : (obj as any)._objects || [];
      for (const child of children) {
        traverse(child);
      }
      return;
    }

    if (obj.fill && typeof obj.fill === 'string') {
      const currentFill = normalizeToHex(obj.fill);
      if (currentFill === normOld) {
        obj.set('fill', normNew);
        changed = true;
      }
    }

    if (obj.stroke && typeof obj.stroke === 'string') {
      const currentStroke = normalizeToHex(obj.stroke);
      if (currentStroke === normOld) {
        obj.set('stroke', normNew);
        changed = true;
      }
    }
  }

  traverse(fabricObject);
  return changed;
}

/**
 * Extracts all unique colors present across the entire canvas or list of objects.
 */
export function extractDocumentColors(objects: FabricObject[], maxColors = 16): string[] {
  const colorsSet = new Set<string>();
  for (const obj of objects) {
    const palette = extractSvgPalette(obj, 8);
    for (const hex of palette) {
      colorsSet.add(hex);
      if (colorsSet.size >= maxColors) break;
    }
    if (colorsSet.size >= maxColors) break;
  }
  return Array.from(colorsSet);
}
