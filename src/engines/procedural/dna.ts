import { Line, Path, Group, FabricObject } from 'fabric';

export interface DnaParams {
  length: number; // in pixels (e.g. 320)
  turns: number; // number of helical turns (e.g. 3)
  amplitude: number; // wave peak height (e.g. 24)
  backboneColor: string;
  strand2Color: string;
}

export const DEFAULT_DNA_PARAMS: DnaParams = {
  length: 320,
  turns: 3,
  amplitude: 24,
  backboneColor: '#0284C7', // Sky 600
  strand2Color: '#4F46E5', // Indigo 600
};

const BASE_PAIR_PALETTE = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

export function createDnaElements(params: DnaParams): FabricObject[] {
  const { length, turns, amplitude, backboneColor, strand2Color } = params;
  const elements: FabricObject[] = [];

  const k = (2 * Math.PI * turns) / length;
  const stepPx = 4;
  const pointsCount = Math.floor(length / stepPx);

  // 1. Cross-rungs (Base pairs) placed at regular intervals
  const rungSpacing = 16;
  const rungCount = Math.floor(length / rungSpacing);

  for (let r = 1; r < rungCount; r++) {
    const rx = (r / rungCount - 0.5) * length;
    const y1 = amplitude * Math.sin(k * (rx + length / 2));
    const y2 = -y1;

    // Only draw rung if separation is noticeable
    if (Math.abs(y1 - y2) > 4) {
      const color = BASE_PAIR_PALETTE[r % BASE_PAIR_PALETTE.length];
      const rung = new Line([rx, y1, rx, y2], {
        stroke: color,
        strokeWidth: 2.2,
        strokeLineCap: 'round',
      });
      elements.push(rung);
    }
  }

  // 2. Continuous Sugar-Phosphate Backbones
  let strand1Svg = '';
  let strand2Svg = '';

  for (let i = 0; i <= pointsCount; i++) {
    const x = (i / pointsCount - 0.5) * length;
    const currentAngle = k * (x + length / 2);
    const y1 = amplitude * Math.sin(currentAngle);
    const y2 = -y1;

    if (i === 0) {
      strand1Svg += `M ${x} ${y1} `;
      strand2Svg += `M ${x} ${y2} `;
    } else {
      strand1Svg += `L ${x} ${y1} `;
      strand2Svg += `L ${x} ${y2} `;
    }
  }

  const strand1 = new Path(strand1Svg.trim(), {
    fill: '',
    stroke: backboneColor,
    strokeWidth: 3.5,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
  });
  elements.push(strand1);

  const strand2 = new Path(strand2Svg.trim(), {
    fill: '',
    stroke: strand2Color,
    strokeWidth: 3.5,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
  });
  elements.push(strand2);

  return elements;
}

export function createDnaGroup(customParams: Partial<DnaParams> = {}): Group {
  const params: DnaParams = { ...DEFAULT_DNA_PARAMS, ...customParams };
  const elements = createDnaElements(params);

  const group = new Group(elements, {
    subTargetCheck: false,
    cornerColor: '#0284C7',
    cornerStyle: 'circle',
    borderColor: '#0284C7',
    transparentCorners: false,
  });

  (group as any).bioType = 'dna';
  (group as any).dnaParams = params;
  (group as any).scientificMeta = {
    name: 'DNA Double Helix',
    category: 'Genetics',
    license: {
      spdx: 'CC0-1.0',
      creator: 'OpenBioFigure Procedural Engine',
      attributionRequired: false,
      sourceUrl: 'https://openbiofigure.org',
    },
  };

  return group;
}
