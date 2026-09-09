export interface ScientificAssetMeta {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  tags: string[];
  svgPath: string;
  license: {
    spdx: 'CC0-1.0' | 'CC-BY-4.0' | 'CC-BY-3.0' | 'MIT';
    attributionRequired: boolean;
    creator: string;
    sourceUrl: string;
  };
}

export interface ScientificPaletteColor {
  name: string;
  hex: string;
  description: string;
}

export const SCIENTIFIC_PALETTES: ScientificPaletteColor[] = [
  { name: 'Cell Teal', hex: '#0D9488', description: 'Cytoplasm / Membrane markers' },
  { name: 'Nature Crimson', hex: '#BE123C', description: 'Nuclei / Signaling nodes' },
  { name: 'Membrane Amber', hex: '#F59E0B', description: 'Lipids / Vesicles' },
  { name: 'Vein Blue', hex: '#1D4ED8', description: 'Receptors / Ligands' },
  { name: 'Lymph Green', hex: '#15803D', description: 'Enzymes / Organelles' },
  { name: 'Bone White', hex: '#F8FAFC', description: 'Contrast fills' },
  { name: 'Slate Gray', hex: '#475569', description: 'Boundaries / Structural pills' },
  { name: 'Pure Black', hex: '#0F172A', description: 'Text / High contrast' },
];

export const CATALOG_CATEGORIES = [
  'All',
  'Anatomy & Clinical',
  'Immunology',
  'Cell Biology',
  'Microbiology',
  'Genetics',
  'Chemistry & Labware',
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];
