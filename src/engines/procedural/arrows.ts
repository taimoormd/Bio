import { Line, Polygon, Group, FabricObject } from 'fabric';

export interface ArrowParams {
  type: 'activation' | 'inhibition';
  length: number; // in pixels (e.g. 160)
  color: string;
  strokeWidth: number;
  headSize: number;
}

export const DEFAULT_ARROW_PARAMS: ArrowParams = {
  type: 'activation',
  length: 160,
  color: '#0284C7', // Sky 600
  strokeWidth: 3,
  headSize: 16,
};

export function createArrowElements(params: ArrowParams): FabricObject[] {
  const { type, length, color, strokeWidth, headSize } = params;
  const elements: FabricObject[] = [];

  const startX = -length / 2;
  const endX = length / 2;
  const y = 0;

  if (type === 'activation') {
    // Shaft line (stops just before arrowhead tip base)
    const shaftEndX = endX - headSize + 2;
    const shaft = new Line([startX, y, shaftEndX, y], {
      stroke: color,
      strokeWidth,
      strokeLineCap: 'round',
    });
    elements.push(shaft);

    // Directional Arrowhead Triangle (pointing right along X axis)
    const arrowHead = new Polygon(
      [
        { x: endX, y: 0 },
        { x: endX - headSize, y: -headSize * 0.6 },
        { x: endX - headSize * 0.8, y: 0 },
        { x: endX - headSize, y: headSize * 0.6 },
      ],
      {
        fill: color,
        stroke: color,
        strokeWidth: 1,
        strokeLineJoin: 'round',
      }
    );
    elements.push(arrowHead);
  } else {
    // Inhibition: Straight shaft ending in a perpendicular bar ("T" stop)
    const shaft = new Line([startX, y, endX, y], {
      stroke: color,
      strokeWidth,
      strokeLineCap: 'round',
    });
    elements.push(shaft);

    // Perpendicular Bar
    const barHalfHeight = headSize * 0.8;
    const bar = new Line([endX, -barHalfHeight, endX, barHalfHeight], {
      stroke: color,
      strokeWidth: strokeWidth * 1.5,
      strokeLineCap: 'round',
    });
    elements.push(bar);
  }

  return elements;
}

export function createPathwayConnector(
  customParams: Partial<ArrowParams> = {}
): Group {
  const params: ArrowParams = { ...DEFAULT_ARROW_PARAMS, ...customParams };
  const elements = createArrowElements(params);

  const group = new Group(elements, {
    subTargetCheck: false,
    cornerColor: '#0284C7',
    cornerStyle: 'circle',
    borderColor: '#0284C7',
    transparentCorners: false,
  });

  (group as any).bioType = 'arrow';
  (group as any).arrowParams = params;
  (group as any).scientificMeta = {
    name: params.type === 'activation' ? 'Activation Arrow (-->)' : 'Inhibition Bar (--|)',
    category: 'Pathway Connectors',
    license: {
      spdx: 'CC0-1.0',
      creator: 'OpenBioFigure Procedural Engine',
      attributionRequired: false,
      sourceUrl: 'https://openbiofigure.org',
    },
  };

  return group;
}
