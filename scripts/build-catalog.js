import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const publicCatalogDir = path.join(rootDir, 'public', 'catalog');
const publicSvgDir = path.join(publicCatalogDir, 'svg');
const publicBioiconsDir = path.join(publicSvgDir, 'bioicons');
const publicHealthiconsDir = path.join(publicSvgDir, 'healthicons');

fs.mkdirSync(publicHealthiconsDir, { recursive: true });

// 1. Curated Bioicons Starter Set
const bioiconsAssets = [
  {
    id: 'bioicons:macrophage',
    name: 'Macrophage',
    category: 'Immunology',
    subCategory: 'Innate Immunity',
    tags: ['phagocyte', 'monocyte', 'innate immunity', 'antigen presentation', 'inflammation', 'macrophage', 'white blood cell'],
    svgFile: 'macrophage.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:t-cell',
    name: 'T-Cell (Lymphocyte)',
    category: 'Immunology',
    subCategory: 'Adaptive Immunity',
    tags: ['t-cell', 't-lymphocyte', 'tcr', 'cd4', 'cd8', 'adaptive immunity', 'cytotoxic'],
    svgFile: 't-cell.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:b-cell',
    name: 'B-Cell (Lymphocyte)',
    category: 'Immunology',
    subCategory: 'Adaptive Immunity',
    tags: ['b-cell', 'b-lymphocyte', 'bcr', 'plasma cell', 'antibody production', 'immunoglobulin'],
    svgFile: 'b-cell.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:antibody',
    name: 'Antibody (IgG)',
    category: 'Immunology',
    subCategory: 'Proteins',
    tags: ['antibody', 'immunoglobulin', 'igg', 'fab', 'fc', 'antigen', 'epitope', 'neutralization'],
    svgFile: 'antibody.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:receptor',
    name: 'Transmembrane Receptor',
    category: 'Cellular Biology',
    subCategory: 'Membrane Proteins',
    tags: ['receptor', 'gpcr', 'rtk', 'transmembrane', 'signal transduction', 'ligand binding', 'kinase'],
    svgFile: 'receptor.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:mitochondria',
    name: 'Mitochondria',
    category: 'Cellular Biology',
    subCategory: 'Organelles',
    tags: ['mitochondria', 'mitochondrion', 'organelle', 'atp', 'cristae', 'respiration', 'energy', 'metabolism'],
    svgFile: 'mitochondria.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:lipid',
    name: 'Phospholipid Molecule',
    category: 'Cellular Biology',
    subCategory: 'Membranes',
    tags: ['lipid', 'phospholipid', 'bilayer', 'membrane', 'hydrophilic', 'hydrophobic', 'fatty acid'],
    svgFile: 'lipid.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:dna-segment',
    name: 'DNA Double Helix',
    category: 'Genetics',
    subCategory: 'Nucleic Acids',
    tags: ['dna', 'double helix', 'nucleic acid', 'genes', 'base pairs', 'adenine', 'thymine', 'cytosine', 'guanine'],
    svgFile: 'dna-segment.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:nucleus',
    name: 'Cell Nucleus',
    category: 'Cellular Biology',
    subCategory: 'Organelles',
    tags: ['nucleus', 'nucleolus', 'chromatin', 'nuclear envelope', 'organelle', 'transcription'],
    svgFile: 'nucleus.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:virus',
    name: 'Virus Particle',
    category: 'Microbiology',
    subCategory: 'Viruses',
    tags: ['virus', 'virion', 'capsid', 'spike protein', 'pathogen', 'infection', 'envelope'],
    svgFile: 'virus.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
  {
    id: 'bioicons:bacteria',
    name: 'Bacterium (Bacillus)',
    category: 'Microbiology',
    subCategory: 'Bacteria',
    tags: ['bacteria', 'bacterium', 'bacillus', 'prokaryote', 'flagella', 'pathogen', 'microbe'],
    svgFile: 'bacteria.svg',
    license: {
      spdx: 'CC-BY-4.0',
      attributionRequired: true,
      creator: 'Simon Duerr / Bioicons',
      sourceUrl: 'https://bioicons.com',
    },
  },
];

// 2. Healthicons Ingestion Mapping
const healthiconsSourceDir = path.join(rootDir, 'node_modules', 'healthicons', 'public', 'icons', 'svg', 'outline');

const healthiconsSelection = [
  // Clinical / Anatomy
  { file: 'body/heart_organ.svg', id: 'healthicons:heart', name: 'Heart Organ', category: 'Clinical/Anatomy', tags: ['heart', 'cardiac', 'cardiovascular', 'organ', 'ventricle'] },
  { file: 'body/lungs.svg', id: 'healthicons:lungs', name: 'Lungs', category: 'Clinical/Anatomy', tags: ['lungs', 'respiratory', 'pulmonary', 'alveoli', 'breathing'] },
  { file: 'body/kidneys.svg', id: 'healthicons:kidneys', name: 'Kidneys', category: 'Clinical/Anatomy', tags: ['kidneys', 'renal', 'nephron', 'filtration', 'urine'] },
  { file: 'body/liver.svg', id: 'healthicons:liver', name: 'Liver', category: 'Clinical/Anatomy', tags: ['liver', 'hepatic', 'metabolism', 'bile', 'organ'] },
  { file: 'body/neurology.svg', id: 'healthicons:brain', name: 'Brain & Nervous System', category: 'Clinical/Anatomy', tags: ['brain', 'cortex', 'neurology', 'cns', 'neuroscience'] },
  { file: 'body/stomach.svg', id: 'healthicons:stomach', name: 'Stomach', category: 'Clinical/Anatomy', tags: ['stomach', 'gastric', 'digestion', 'gi tract'] },
  { file: 'body/pancreas.svg', id: 'healthicons:pancreas', name: 'Pancreas', category: 'Clinical/Anatomy', tags: ['pancreas', 'insulin', 'endocrine', 'islet cells'] },
  { file: 'body/thyroid.svg', id: 'healthicons:thyroid', name: 'Thyroid Gland', category: 'Clinical/Anatomy', tags: ['thyroid', 'endocrine', 'hormones', 't3', 't4'] },
  { file: 'body/skeleton.svg', id: 'healthicons:skeleton', name: 'Human Skeleton', category: 'Clinical/Anatomy', tags: ['skeleton', 'bones', 'osteology', 'skeletal system'] },
  { file: 'body/blood_cells.svg', id: 'healthicons:blood-cells', name: 'Red Blood Cells (Erythrocytes)', category: 'Cellular Biology', tags: ['blood cells', 'erythrocytes', 'rbc', 'hematology', 'hemoglobin'] },
  { file: 'body/cell_nuclei.svg', id: 'healthicons:cell-nuclei', name: 'Cellular Nuclei', category: 'Cellular Biology', tags: ['cell', 'nucleus', 'histology', 'tissue'] },
  { file: 'body/dna.svg', id: 'healthicons:dna', name: 'DNA Strand', category: 'Genetics', tags: ['dna', 'genetics', 'chromosome', 'genome'] },
  { file: 'body/enzyme.svg', id: 'healthicons:enzyme', name: 'Enzyme Active Site', category: 'Cellular Biology', tags: ['enzyme', 'catalysis', 'substrate', 'protein'] },
  { file: 'body/lymph_nodes.svg', id: 'healthicons:lymph-nodes', name: 'Lymphatic System', category: 'Immunology', tags: ['lymph', 'lymph nodes', 'immune system', 'vessels'] },

  // Lab Equipment
  { file: 'devices/microscope.svg', id: 'healthicons:microscope', name: 'Compound Microscope', category: 'Lab Equipment', tags: ['microscope', 'microscopy', 'magnification', 'lab', 'optics'] },
  { file: 'devices/test_tubes.svg', id: 'healthicons:test-tubes', name: 'Test Tubes in Rack', category: 'Lab Equipment', tags: ['test tubes', 'rack', 'reagents', 'pipette', 'chemistry'] },
  { file: 'devices/medical_sample.svg', id: 'healthicons:petri-dish', name: 'Petri Dish Culture', category: 'Lab Equipment', tags: ['petri dish', 'culture', 'agar', 'colony', 'sample'] },
  { file: 'devices/syringe.svg', id: 'healthicons:syringe', name: 'Injection Syringe', category: 'Lab Equipment', tags: ['syringe', 'injection', 'needle', 'dose', 'vaccine'] },
  { file: 'devices/virus_lab_research_test_tube.svg', id: 'healthicons:viral-assay', name: 'Viral Assay Vial', category: 'Lab Equipment', tags: ['vial', 'cryovial', 'assay', 'pcr', 'specimen'] },
  { file: 'devices/xray.svg', id: 'healthicons:xray', name: 'Radiograph / X-Ray Film', category: 'Clinical/Anatomy', tags: ['xray', 'radiography', 'imaging', 'scan'] },
  { file: 'blood/blood_bag.svg', id: 'healthicons:blood-bag', name: 'Blood Transfusion Bag', category: 'Clinical/Anatomy', tags: ['blood bag', 'transfusion', 'donor', 'plasma'] },
];

const manifest = [];

// Process Bioicons
for (const item of bioiconsAssets) {
  const destRel = `/catalog/svg/bioicons/${item.svgFile}`;
  manifest.push({
    id: item.id,
    name: item.name,
    category: item.category,
    subCategory: item.subCategory,
    tags: item.tags,
    svgPath: destRel,
    license: item.license,
  });
}

// Process Healthicons
for (const item of healthiconsSelection) {
  const srcPath = path.join(healthiconsSourceDir, item.file);
  const fileName = path.basename(item.file);
  const destPath = path.join(publicHealthiconsDir, fileName);

  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf-8');
    // Ensure clean stroke and fill properties
    if (!content.includes('viewBox')) {
      content = content.replace('<svg', '<svg viewBox="0 0 48 48"');
    }
    fs.writeFileSync(destPath, content, 'utf-8');

    manifest.push({
      id: item.id,
      name: item.name,
      category: item.category,
      subCategory: item.category,
      tags: item.tags,
      svgPath: `/catalog/svg/healthicons/${fileName}`,
      license: {
        spdx: 'MIT',
        attributionRequired: false,
        creator: 'Resolve to Save Lives / Health Icons',
        sourceUrl: 'https://healthicons.org',
      },
    });
  } else {
    console.warn(`[Warning] Missing healthicon source file: ${srcPath}`);
  }
}

// Write manifest.json
const manifestPath = path.join(publicCatalogDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Successfully built scientific catalog with ${manifest.length} vector icons in ${manifestPath}`);
