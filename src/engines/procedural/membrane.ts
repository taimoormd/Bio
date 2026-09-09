import { Circle, Path, Group, FabricObject } from 'fabric';

export interface MembraneParams {
  length: number; // total width in pixels (e.g. 280)
  spacing: number; // distance between lipids (e.g. 16)
  curvature: number; // 0 = straight, 0.1 - 1.0 = curved arc
  headColor: string;
  tailColor: string;
}

export const DEFAULT_MEMBRANE_PARAMS: MembraneParams = {
  length: 280,
  spacing: 16,
  curvature: 0,
  headColor: '#F59E0B', // Amber 500
  tailColor: '#D97706', // Amber 600
};

export function createMembraneElements(params: MembraneParams): FabricObject[] {
  const { length, spacing, curvature, headColor, tailColor } = params;
  const elements: FabricObject[] = [];

  const count = Math.max(3, Math.floor(length / spacing));
  const headRadius = Math.min(6, (spacing / 2) * 0.85);
  const leafletGap = 20; // distance from midline to head center

  for (let i = 0; i <= count; i++) {
    const t = count === 0 ? 0.5 : i / count;
    const x = (t - 0.5) * length;
    // Parabolic arch: y = -curvature * (length * 0.35) * 4 * t * (1 - t)
    const arcHeight = curvature * (length * 0.3);
    const y = -arcHeight * 4 * t * (1 - t);

    // Tangent vector
    const dx = length;
    const dy = -arcHeight * 4 * (1 - 2 * t);
    const angle = Math.atan2(dy, dx);

    // Unit normal vector (pointing upward/outward)
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);

    // Unit tangent vector
    const tx = Math.cos(angle);
    const ty = Math.sin(angle);

    // -------------------------------------------------------------
    // Outer Leaflet (Heads outward, tails toward midline)
    // -------------------------------------------------------------
    const outerHeadX = x - nx * leafletGap;
    const outerHeadY = y - ny * leafletGap;

    const outerHead = new Circle({
      left: outerHeadX - headRadius,
      top: outerHeadY - headRadius,
      radius: headRadius,
      fill: headColor,
      stroke: tailColor,
      strokeWidth: 1.2,
      originX: 'left',
      originY: 'top',
    });
    elements.push(outerHead);

    // Outer Tails (two wiggly wavy tails per head)
    const tail1StartX = outerHeadX - tx * (headRadius * 0.45);
    const tail1StartY = outerHeadY - ty * (headRadius * 0.45);
    const tail1EndX = x - tx * (headRadius * 0.45) - nx * 2;
    const tail1EndY = y - ty * (headRadius * 0.45) - ny * 2;
    const mid1X = (tail1StartX + tail1EndX) / 2 + tx * 3;
    const mid1Y = (tail1StartY + tail1EndY) / 2 + ty * 3;

    const tail1 = new Path(
      `M ${tail1StartX} ${tail1StartY} Q ${mid1X} ${mid1Y} ${tail1EndX} ${tail1EndY}`,
      {
        fill: '',
        stroke: tailColor,
        strokeWidth: 1.5,
        strokeLineCap: 'round',
      }
    );
    elements.push(tail1);

    const tail2StartX = outerHeadX + tx * (headRadius * 0.45);
    const tail2StartY = outerHeadY + ty * (headRadius * 0.45);
    const tail2EndX = x + tx * (headRadius * 0.45) - nx * 2;
    const tail2EndY = y + tx * (headRadius * 0.45) - ny * 2;
    const mid2X = (tail2StartX + tail2EndX) / 2 - tx * 3;
    const mid2Y = (tail2StartY + tail2EndY) / 2 - ty * 3;

    const tail2 = new Path(
      `M ${tail2StartX} ${tail2StartY} Q ${mid2X} ${mid2Y} ${tail2EndX} ${tail2EndY}`,
      {
        fill: '',
        stroke: tailColor,
        strokeWidth: 1.5,
        strokeLineCap: 'round',
      }
    );
    elements.push(tail2);

    // -------------------------------------------------------------
    // Inner Leaflet (Heads downward/inward, tails toward midline)
    // -------------------------------------------------------------
    const innerHeadX = x + nx * leafletGap;
    const innerHeadY = y + ny * leafletGap;

    const innerHead = new Circle({
      left: innerHeadX - headRadius,
      top: innerHeadY - headRadius,
      radius: headRadius,
      fill: headColor,
      stroke: tailColor,
      strokeWidth: 1.2,
      originX: 'left',
      originY: 'top',
    });
    elements.push(innerHead);

    const iTail1StartX = innerHeadX - tx * (headRadius * 0.45);
    const iTail1StartY = innerHeadY - ty * (headRadius * 0.45);
    const iTail1EndX = x - tx * (headRadius * 0.45) + nx * 2;
    const iTail1EndY = y - ty * (headRadius * 0.45) + ny * 2;
    const iMid1X = (iTail1StartX + iTail1EndX) / 2 + tx * 3;
    const iMid1Y = (iTail1StartY + iTail1EndY) / 2 + ty * 3;

    const iTail1 = new Path(
      `M ${iTail1StartX} ${iTail1StartY} Q ${iMid1X} ${iMid1Y} ${iTail1EndX} ${iTail1EndY}`,
      {
        fill: '',
        stroke: tailColor,
        strokeWidth: 1.5,
        strokeLineCap: 'round',
      }
    );
    elements.push(iTail1);

    const iTail2StartX = innerHeadX + tx * (headRadius * 0.45);
    const iTail2StartY = innerHeadY + ty * (headRadius * 0.45);
    const iTail2EndX = x + tx * (headRadius * 0.45) + nx * 2;
    const iTail2EndY = y + tx * (headRadius * 0.45) + ny * 2;
    const iMid2X = (iTail2StartX + iTail2EndX) / 2 - tx * 3;
    const iMid2Y = (iTail2StartY + iTail2EndY) / 2 - ty * 3;

    const iTail2 = new Path(
      `M ${iTail2StartX} ${iTail2StartY} Q ${iMid2X} ${iMid2Y} ${iTail2EndX} ${iTail2EndY}`,
      {
        fill: '',
        stroke: tailColor,
        strokeWidth: 1.5,
        strokeLineCap: 'round',
      }
    );
    elements.push(iTail2);
  }

  return elements;
}

export function createMembraneGroup(
  customParams: Partial<MembraneParams> = {}
): Group {
  const params: MembraneParams = { ...DEFAULT_MEMBRANE_PARAMS, ...customParams };
  const elements = createMembraneElements(params);

  const group = new Group(elements, {
    subTargetCheck: false,
    cornerColor: '#0284C7',
    cornerStyle: 'circle',
    borderColor: '#0284C7',
    transparentCorners: false,
  });

  (group as any).bioType = 'membrane';
  (group as any).membraneParams = params;
  (group as any).scientificMeta = {
    name: 'Phospholipid Bilayer',
    category: 'Cellular Biology',
    license: {
      spdx: 'CC0-1.0',
      creator: 'OpenBioFigure Procedural Engine',
      attributionRequired: false,
      sourceUrl: 'https://openbiofigure.org',
    },
  };

  return group;
}
