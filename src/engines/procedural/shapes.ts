import {
  Rect,
  Circle,
  Ellipse,
  Triangle,
  Polygon,
  Path,
  Line,
  Group,
  FabricObject,
} from 'fabric';
import { createPathwayConnector } from './arrows';

export interface ShapeDefinition {
  id: string;
  name: string;
  category: 'basic' | 'connectors' | 'annotations';
  tags: string[];
  create: (color?: string, strokeColor?: string) => FabricObject;
}

const DEFAULT_FILL = '#E0F2FE'; // Sky-100
const DEFAULT_STROKE = '#0284C7'; // Sky-600
const DEFAULT_STROKE_WIDTH = 2;

const defaultCommonOptions = (fill = DEFAULT_FILL, stroke = DEFAULT_STROKE) => ({
  fill,
  stroke,
  strokeWidth: DEFAULT_STROKE_WIDTH,
  strokeUniform: true,
  cornerColor: '#0284C7',
  cornerStyle: 'circle' as const,
  borderColor: '#0284C7',
  transparentCorners: false,
});

/**
 * Generate regular polygon points (e.g. Hexagon, Pentagon, Octagon)
 */
function getRegularPolygonPoints(sides: number, radius: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = sides % 2 === 0 ? Math.PI / sides : -Math.PI / 2;
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    points.push({
      x: radius + radius * Math.cos(angle),
      y: radius + radius * Math.sin(angle),
    });
  }
  return points;
}

/**
 * Generate star points
 */
function getStarPoints(
  pointsCount: number,
  outerRadius: number,
  innerRadius: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const step = Math.PI / pointsCount;
  let angle = -Math.PI / 2;

  for (let i = 0; i < pointsCount * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    points.push({
      x: outerRadius + r * Math.cos(angle),
      y: outerRadius + r * Math.sin(angle),
    });
    angle += step;
  }
  return points;
}

export const SHAPE_CATALOG: ShapeDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. BASIC & GEOMETRIC SHAPES
  // ---------------------------------------------------------------------------
  {
    id: 'square',
    name: 'Square',
    category: 'basic',
    tags: ['box', 'cube', 'rectangle'],
    create: (fill, stroke) =>
      new Rect({
        ...defaultCommonOptions(fill, stroke),
        width: 100,
        height: 100,
      }),
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    category: 'basic',
    tags: ['box', 'panel', 'compartment'],
    create: (fill, stroke) =>
      new Rect({
        ...defaultCommonOptions(fill, stroke),
        width: 160,
        height: 100,
      }),
  },
  {
    id: 'rounded-rect',
    name: 'Rounded Rectangle',
    category: 'basic',
    tags: ['card', 'smooth', 'box'],
    create: (fill, stroke) =>
      new Rect({
        ...defaultCommonOptions(fill, stroke),
        width: 160,
        height: 100,
        rx: 14,
        ry: 14,
      }),
  },
  {
    id: 'capsule',
    name: 'Capsule / Pill',
    category: 'basic',
    tags: ['pill', 'stadium', 'capsule', 'medicine'],
    create: (fill, stroke) =>
      new Rect({
        ...defaultCommonOptions(fill, stroke),
        width: 160,
        height: 60,
        rx: 30,
        ry: 30,
      }),
  },
  {
    id: 'circle',
    name: 'Circle',
    category: 'basic',
    tags: ['round', 'dot', 'node', 'organelle'],
    create: (fill, stroke) =>
      new Circle({
        ...defaultCommonOptions(fill, stroke),
        radius: 50,
      }),
  },
  {
    id: 'ellipse',
    name: 'Ellipse',
    category: 'basic',
    tags: ['oval', 'cell', 'nucleus'],
    create: (fill, stroke) =>
      new Ellipse({
        ...defaultCommonOptions(fill, stroke),
        rx: 70,
        ry: 45,
      }),
  },
  {
    id: 'semi-circle',
    name: 'Semi-Circle',
    category: 'basic',
    tags: ['half', 'dome', 'arch'],
    create: (fill, stroke) =>
      new Path('M 0 50 A 50 50 0 0 1 100 50 Z', {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'donut',
    name: 'Donut / Ring',
    category: 'basic',
    tags: ['ring', 'torus', 'circular', 'pore'],
    create: (fill, stroke) =>
      new Path(
        'M 50 0 A 50 50 0 1 0 50 100 A 50 50 0 1 0 50 0 Z M 50 25 A 25 25 0 1 1 50 75 A 25 25 0 1 1 50 25 Z',
        {
          ...defaultCommonOptions(fill, stroke),
          fillRule: 'evenodd',
        }
      ),
  },
  {
    id: 'triangle',
    name: 'Triangle',
    category: 'basic',
    tags: ['equilateral', 'delta', 'pyramid'],
    create: (fill, stroke) =>
      new Triangle({
        ...defaultCommonOptions(fill, stroke),
        width: 100,
        height: 86.6,
      }),
  },
  {
    id: 'right-triangle',
    name: 'Right Triangle',
    category: 'basic',
    tags: ['orthogonal', 'corner', 'slope'],
    create: (fill, stroke) =>
      new Polygon(
        [
          { x: 0, y: 0 },
          { x: 0, y: 100 },
          { x: 100, y: 100 },
        ],
        {
          ...defaultCommonOptions(fill, stroke),
        }
      ),
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'basic',
    tags: ['rhombus', 'decision', 'flowchart'],
    create: (fill, stroke) =>
      new Polygon(
        [
          { x: 50, y: 0 },
          { x: 100, y: 50 },
          { x: 50, y: 100 },
          { x: 0, y: 50 },
        ],
        {
          ...defaultCommonOptions(fill, stroke),
        }
      ),
  },
  {
    id: 'hexagon',
    name: 'Hexagon (Benzene / Glucose)',
    category: 'basic',
    tags: ['benzene', 'biochemistry', 'pyranose', 'aromatic', 'polygon'],
    create: (fill, stroke) =>
      new Polygon(getRegularPolygonPoints(6, 50), {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'pentagon',
    name: 'Pentagon (Furanose / Ribose)',
    category: 'basic',
    tags: ['ribose', 'furanose', 'sugar', 'five'],
    create: (fill, stroke) =>
      new Polygon(getRegularPolygonPoints(5, 50), {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'octagon',
    name: 'Octagon',
    category: 'basic',
    tags: ['stop', 'eight', 'polygon'],
    create: (fill, stroke) =>
      new Polygon(getRegularPolygonPoints(8, 50), {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'cylinder',
    name: 'Cylinder / Beaker',
    category: 'basic',
    tags: ['tube', 'column', 'container', 'beaker', 'vessel', 'cylinder'],
    create: (fill, stroke) =>
      new Path(
        'M 0 20 C 0 8 22 0 50 0 C 78 0 100 8 100 20 L 100 80 C 100 92 78 100 50 100 C 22 100 0 92 0 80 Z M 0 20 C 0 32 22 40 50 40 C 78 40 100 32 100 20',
        {
          ...defaultCommonOptions(fill, stroke),
        }
      ),
  },
  {
    id: 'star-4',
    name: '4-Point Star',
    category: 'basic',
    tags: ['sparkle', 'gleam', 'four'],
    create: (fill, stroke) =>
      new Polygon(getStarPoints(4, 50, 20), {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'star-5',
    name: '5-Point Star',
    category: 'basic',
    tags: ['rating', 'favorite', 'badge'],
    create: (fill, stroke) =>
      new Polygon(getStarPoints(5, 50, 22), {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'star-6',
    name: '6-Point Star',
    category: 'basic',
    tags: ['badge', 'six', 'marker'],
    create: (fill, stroke) =>
      new Polygon(getStarPoints(6, 50, 25), {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'banner',
    name: 'Banner / Ribbon',
    category: 'basic',
    tags: ['ribbon', 'label', 'flag'],
    create: (fill, stroke) =>
      new Path('M 0 0 L 140 0 L 125 30 L 140 60 L 0 60 L 15 30 Z', {
        ...defaultCommonOptions(fill, stroke),
      }),
  },
  {
    id: 'cross',
    name: 'Cross / Plus',
    category: 'basic',
    tags: ['plus', 'add', 'medical', 'hospital'],
    create: (fill, stroke) =>
      new Path(
        'M 35 0 L 65 0 L 65 35 L 100 35 L 100 65 L 65 65 L 65 100 L 35 100 L 35 65 L 0 65 L 0 35 L 35 35 Z',
        {
          ...defaultCommonOptions(fill, stroke),
        }
      ),
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'basic',
    tags: ['cardio', 'organ', 'love', 'health'],
    create: (fill, stroke) =>
      new Path(
        'M 50 85 C 50 85 10 55 10 30 C 10 12 25 5 38 10 C 45 14 50 22 50 22 C 50 22 55 14 62 10 C 75 5 90 12 90 30 C 90 55 50 85 50 85 Z',
        {
          ...defaultCommonOptions(fill || '#FEE2E2', stroke || '#EF4444'),
        }
      ),
  },
  {
    id: 'lightning',
    name: 'Lightning Bolt',
    category: 'basic',
    tags: ['energy', 'voltage', 'action-potential', 'flash'],
    create: (fill, stroke) =>
      new Polygon(
        [
          { x: 55, y: 0 },
          { x: 20, y: 55 },
          { x: 48, y: 55 },
          { x: 40, y: 100 },
          { x: 80, y: 42 },
          { x: 52, y: 42 },
        ],
        {
          ...defaultCommonOptions(fill || '#FEF08A', stroke || '#CA8A04'),
        }
      ),
  },
  {
    id: 'checkmark',
    name: 'Checkmark',
    category: 'basic',
    tags: ['success', 'valid', 'approved', 'pass'],
    create: (fill, stroke) =>
      new Path('M 12 52 L 38 78 L 88 18 L 76 8 L 38 58 L 24 42 Z', {
        ...defaultCommonOptions(fill || '#DCFCE7', stroke || '#16A34A'),
      }),
  },

  // ---------------------------------------------------------------------------
  // 2. SCIENTIFIC & FLOWCHART CONNECTORS
  // ---------------------------------------------------------------------------
  {
    id: 'line-solid',
    name: 'Straight Line',
    category: 'connectors',
    tags: ['divider', 'connector', 'link'],
    create: (_fill, stroke = DEFAULT_STROKE) =>
      new Line([0, 0, 160, 0], {
        stroke,
        strokeWidth: 3,
        strokeLineCap: 'round',
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
      }),
  },
  {
    id: 'line-dashed',
    name: 'Dashed Line',
    category: 'connectors',
    tags: ['indirect', 'transient', 'dashed'],
    create: (_fill, stroke = DEFAULT_STROKE) =>
      new Line([0, 0, 160, 0], {
        stroke,
        strokeWidth: 3,
        strokeDashArray: [8, 6],
        strokeLineCap: 'round',
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
      }),
  },
  {
    id: 'line-dotted',
    name: 'Dotted Line',
    category: 'connectors',
    tags: ['weak', 'hypothetical', 'dotted'],
    create: (_fill, stroke = DEFAULT_STROKE) =>
      new Line([0, 0, 160, 0], {
        stroke,
        strokeWidth: 3,
        strokeDashArray: [3, 4],
        strokeLineCap: 'round',
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
      }),
  },
  {
    id: 'arrow-activation',
    name: 'Activation Arrow',
    category: 'connectors',
    tags: ['promotes', 'stimulates', 'induces', 'pathway'],
    create: (_fill, stroke = DEFAULT_STROKE) =>
      createPathwayConnector({ type: 'activation', color: stroke }),
  },
  {
    id: 'arrow-inhibition',
    name: 'Inhibition Bar (--|)',
    category: 'connectors',
    tags: ['represses', 'blocks', 'suppresses', 'inhibition'],
    create: (_fill, stroke = '#EF4444') =>
      createPathwayConnector({ type: 'inhibition', color: stroke }),
  },
  {
    id: 'arrow-double',
    name: 'Double-Headed Arrow',
    category: 'connectors',
    tags: ['bidirectional', 'interacts', 'two-way'],
    create: (_fill, stroke = DEFAULT_STROKE) => {
      const length = 160;
      const headSize = 14;
      const shaft = new Line([-length / 2 + headSize - 2, 0, length / 2 - headSize + 2, 0], {
        stroke,
        strokeWidth: 3,
        strokeLineCap: 'round',
      });
      const leftHead = new Polygon(
        [
          { x: -length / 2, y: 0 },
          { x: -length / 2 + headSize, y: -headSize * 0.6 },
          { x: -length / 2 + headSize * 0.8, y: 0 },
          { x: -length / 2 + headSize, y: headSize * 0.6 },
        ],
        { fill: stroke, stroke, strokeWidth: 1 }
      );
      const rightHead = new Polygon(
        [
          { x: length / 2, y: 0 },
          { x: length / 2 - headSize, y: -headSize * 0.6 },
          { x: length / 2 - headSize * 0.8, y: 0 },
          { x: length / 2 - headSize, y: headSize * 0.6 },
        ],
        { fill: stroke, stroke, strokeWidth: 1 }
      );
      return new Group([shaft, leftHead, rightHead], {
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
      });
    },
  },
  {
    id: 'arrow-equilibrium',
    name: 'Equilibrium Arrow (<==>)',
    category: 'connectors',
    tags: ['reversible', 'equilibrium', 'kinetics', 'chemistry'],
    create: (_fill, stroke = DEFAULT_STROKE) => {
      const length = 160;
      const headSize = 12;
      // Top arrow pointing right (half arrowhead)
      const topShaft = new Line([-length / 2, -6, length / 2 - headSize + 2, -6], {
        stroke,
        strokeWidth: 2.5,
        strokeLineCap: 'round',
      });
      const topHead = new Polygon(
        [
          { x: length / 2, y: -6 },
          { x: length / 2 - headSize, y: -6 - headSize * 0.7 },
          { x: length / 2 - headSize * 0.6, y: -6 },
        ],
        { fill: stroke, stroke, strokeWidth: 1 }
      );
      // Bottom arrow pointing left (half arrowhead)
      const bottomShaft = new Line([-length / 2 + headSize - 2, 6, length / 2, 6], {
        stroke,
        strokeWidth: 2.5,
        strokeLineCap: 'round',
      });
      const bottomHead = new Polygon(
        [
          { x: -length / 2, y: 6 },
          { x: -length / 2 + headSize, y: 6 + headSize * 0.7 },
          { x: -length / 2 + headSize * 0.6, y: 6 },
        ],
        { fill: stroke, stroke, strokeWidth: 1 }
      );
      return new Group([topShaft, topHead, bottomShaft, bottomHead], {
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
      });
    },
  },
  {
    id: 'arrow-arc',
    name: 'Feedback Loop (Arc Arrow)',
    category: 'connectors',
    tags: ['feedback', 'loop', 'cycle', 'autoregulation'],
    create: (_fill, stroke = DEFAULT_STROKE) => {
      // 270-degree arc with arrowhead at the end
      const arcPath = new Path('M 50 10 A 40 40 0 1 1 15 65', {
        fill: '',
        stroke,
        strokeWidth: 3,
        strokeLineCap: 'round',
      });
      const head = new Polygon(
        [
          { x: 12, y: 65 },
          { x: 30, y: 60 },
          { x: 24, y: 69 },
          { x: 26, y: 80 },
        ],
        { fill: stroke, stroke, strokeWidth: 1 }
      );
      return new Group([arcPath, head], {
        cornerColor: '#0284C7',
        cornerStyle: 'circle',
        borderColor: '#0284C7',
      });
    },
  },

  // ---------------------------------------------------------------------------
  // 3. ANNOTATION SHAPES
  // ---------------------------------------------------------------------------
  {
    id: 'callout-speech',
    name: 'Speech Callout',
    category: 'annotations',
    tags: ['callout', 'speech', 'quote', 'label'],
    create: (fill, stroke) =>
      new Path(
        'M 15 0 L 145 0 C 153 0 160 7 160 15 L 160 75 C 160 83 153 90 145 90 L 55 90 L 30 115 L 35 90 L 15 90 C 7 90 0 83 0 75 L 0 15 C 0 7 7 0 15 0 Z',
        {
          ...defaultCommonOptions(fill, stroke),
        }
      ),
  },
  {
    id: 'callout-thought',
    name: 'Thought Bubble',
    category: 'annotations',
    tags: ['thought', 'cloud', 'annotation', 'note'],
    create: (fill, stroke) =>
      new Path(
        'M 30 50 A 25 25 0 0 1 55 25 A 30 30 0 0 1 105 25 A 25 25 0 0 1 135 45 A 25 25 0 0 1 140 75 A 25 25 0 0 1 115 95 A 30 30 0 0 1 65 95 A 25 25 0 0 1 30 75 A 20 20 0 0 1 30 50 Z M 20 105 A 8 8 0 1 1 20 121 A 8 8 0 1 1 20 105 Z M 10 125 A 5 5 0 1 1 10 135 A 5 5 0 1 1 10 125 Z',
        {
          ...defaultCommonOptions(fill, stroke),
        }
      ),
  },
  {
    id: 'curly-bracket-h',
    name: 'Curly Bracket (Horizontal {)',
    category: 'annotations',
    tags: ['bracket', 'group', 'brace', 'horizontal'],
    create: (_fill, stroke = DEFAULT_STROKE) =>
      new Path(
        'M 0 35 C 40 35 50 30 65 10 C 80 30 90 35 130 35',
        {
          fill: '',
          stroke,
          strokeWidth: 2.5,
          strokeLineCap: 'round',
          cornerColor: '#0284C7',
          cornerStyle: 'circle',
          borderColor: '#0284C7',
        }
      ),
  },
  {
    id: 'curly-bracket-v',
    name: 'Curly Bracket (Vertical })',
    category: 'annotations',
    tags: ['bracket', 'group', 'brace', 'vertical'],
    create: (_fill, stroke = DEFAULT_STROKE) =>
      new Path(
        'M 10 0 C 10 40 15 50 35 65 C 15 80 10 90 10 130',
        {
          fill: '',
          stroke,
          strokeWidth: 2.5,
          strokeLineCap: 'round',
          cornerColor: '#0284C7',
          cornerStyle: 'circle',
          borderColor: '#0284C7',
        }
      ),
  },
];
