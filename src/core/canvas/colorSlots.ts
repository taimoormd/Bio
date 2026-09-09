import { FabricObject, Group } from 'fabric';
import { normalizeToHex } from './colorUtils';

export interface ColorSlot {
  id: string;              // unique stable slot id: 'slot-0', 'slot-1', etc.
  label: string;           // 'Part 1', 'Part 2', etc.
  color: string;           // current 6-digit hex (e.g. '#205482')
  type: 'fill' | 'stroke'; // primary target
  pathIndices: number[];   // indices of target children in the group
}

/**
 * Extracts or retrieves persistent color slots for a FabricObject or Group.
 * Unlike a Set-based deduplication, once slots are established, changing
 * their colors will NEVER collapse two slots into one, even if they share
 * the exact same hex code.
 */
export function extractColorSlots(fabricObject: FabricObject, maxSlots = 8): ColorSlot[] {
  if (!fabricObject || fabricObject.visible === false) return [];

  // If the object already has persistent color slots assigned, validate and refresh colors
  const existingSlots: ColorSlot[] | undefined = (fabricObject as any)._colorSlots;

  if (fabricObject instanceof Group || (fabricObject as any)._objects) {
    const children: FabricObject[] =
      typeof (fabricObject as Group).getObjects === 'function'
        ? (fabricObject as Group).getObjects()
        : (fabricObject as any)._objects || [];

    if (existingSlots && existingSlots.length > 0) {
      // Refresh colors from the actual child objects
      for (const slot of existingSlots) {
        if (slot.pathIndices.length > 0) {
          const firstChild = children[slot.pathIndices[0]];
          if (firstChild) {
            const raw = slot.type === 'stroke' ? firstChild.stroke : firstChild.fill;
            const hex = normalizeToHex(raw);
            if (hex) slot.color = hex;
          }
        }
      }
      return existingSlots;
    }

    // Initialize slots for the first time
    // We scan children and group paths by their initial distinct colors
    const colorToSlotMap = new Map<string, { pathIndices: number[]; type: 'fill' | 'stroke' }>();

    children.forEach((child, idx) => {
      if (!child || child.visible === false) return;
      if (child.fill && typeof child.fill === 'string') {
        const fillHex = normalizeToHex(child.fill);
        if (fillHex) {
          const key = 'fill-' + fillHex.toLowerCase();
          if (!colorToSlotMap.has(key)) {
            colorToSlotMap.set(key, { pathIndices: [], type: 'fill' });
          }
          colorToSlotMap.get(key)!.pathIndices.push(idx);
        }
      } else if (child.stroke && typeof child.stroke === 'string' && (child.strokeWidth || 0) > 0) {
        const strokeHex = normalizeToHex(child.stroke);
        if (strokeHex) {
          const key = 'stroke-' + strokeHex.toLowerCase();
          if (!colorToSlotMap.has(key)) {
            colorToSlotMap.set(key, { pathIndices: [], type: 'stroke' });
          }
          colorToSlotMap.get(key)!.pathIndices.push(idx);
        }
      }
    });

    const newSlots: ColorSlot[] = [];
    let slotCount = 0;
    for (const [key, val] of colorToSlotMap.entries()) {
      if (slotCount >= maxSlots) break;
      const colorHex = key.replace(/^(fill|stroke)-/, '');
      newSlots.push({
        id: 'slot-' + slotCount,
        label: 'Part ' + (slotCount + 1),
        color: colorHex,
        type: val.type,
        pathIndices: val.pathIndices,
      });
      slotCount++;
    }

    (fabricObject as any)._colorSlots = newSlots;
    return newSlots;
  }

  // Single leaf object (not a group)
  const singleFill = normalizeToHex(fabricObject.fill);
  const singleStroke = (fabricObject.strokeWidth || 0) > 0 ? normalizeToHex(fabricObject.stroke) : null;
  const singleSlots: ColorSlot[] = [];

  if (singleFill) {
    singleSlots.push({
      id: 'slot-0',
      label: 'Fill',
      color: singleFill,
      type: 'fill',
      pathIndices: [0],
    });
  }
  if (singleStroke) {
    singleSlots.push({
      id: 'slot-1',
      label: 'Border',
      color: singleStroke,
      type: 'stroke',
      pathIndices: [0],
    });
  }

  return singleSlots;
}

/**
 * Recolors a specific persistent slot without collapsing slots or affecting
 * other parts that may share the same color.
 */
export function recolorSlotInObject(
  fabricObject: FabricObject,
  slotId: string,
  newHex: string
): boolean {
  const normNew = normalizeToHex(newHex) || newHex.toLowerCase();
  if (!normNew) return false;

  const slots: ColorSlot[] | undefined = (fabricObject as any)._colorSlots;

  if (fabricObject instanceof Group || (fabricObject as any)._objects) {
    const children: FabricObject[] =
      typeof (fabricObject as Group).getObjects === 'function'
        ? (fabricObject as Group).getObjects()
        : (fabricObject as any)._objects || [];

    if (!slots || slots.length === 0) {
      extractColorSlots(fabricObject);
    }

    const targetSlot = ((fabricObject as any)._colorSlots as ColorSlot[])?.find((s) => s.id === slotId);
    if (!targetSlot) return false;

    // Update only the targeted child paths
    for (const idx of targetSlot.pathIndices) {
      const child = children[idx];
      if (child) {
        if (targetSlot.type === 'stroke') {
          child.set('stroke', normNew);
        } else {
          child.set('fill', normNew);
        }
      }
    }

    targetSlot.color = normNew;
    return true;
  }

  // Single object
  if (fabricObject.fill) {
    fabricObject.set('fill', normNew);
    return true;
  }
  return false;
}
