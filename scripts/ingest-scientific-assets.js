import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const publicCatalogDir = path.join(rootDir, 'public', 'catalog');
const publicSvgDir = path.join(publicCatalogDir, 'svg');

fs.mkdirSync(publicSvgDir, { recursive: true });

// Standard category taxonomies
const CATEGORY_MAP = {
  // Genetics
  'amino-acids': 'Genetics',
  'amino_acids': 'Genetics',
  'peptides': 'Genetics',
  'nucleic_acids': 'Genetics',
  'nucleic-acids': 'Genetics',
  'genetics': 'Genetics',
  'genomics': 'Genetics',
  'epigenetics': 'Genetics',
  'molecular_biology': 'Genetics',
  'molecular-biology': 'Genetics',

  // Immunology
  'blood_immunology': 'Immunology',
  'blood-immunology': 'Immunology',
  'immunology': 'Immunology',
  'blood': 'Immunology',

  // Cell Biology
  'cell_membrane': 'Cell Biology',
  'cell-membrane': 'Cell Biology',
  'cell_types': 'Cell Biology',
  'cell-types': 'Cell Biology',
  'cell_culture': 'Cell Biology',
  'cell-culture': 'Cell Biology',
  'cell_lines': 'Cell Biology',
  'cell-lines': 'Cell Biology',
  'intracellular_components': 'Cell Biology',
  'intracellular-components': 'Cell Biology',
  'receptors_channels': 'Cell Biology',
  'receptors-channels': 'Cell Biology',
  'extracellular_matrix': 'Cell Biology',
  'extracellular-matrix': 'Cell Biology',
  'plants_algae': 'Cell Biology',
  'plants-algae': 'Cell Biology',
  'animals': 'Cell Biology',

  // Microbiology
  'microbiology': 'Microbiology',
  'viruses': 'Microbiology',
  'parasites': 'Microbiology',
  'zoonoses': 'Microbiology',

  // Anatomy & Clinical
  'human_physiology': 'Anatomy & Clinical',
  'human-physiology': 'Anatomy & Clinical',
  'tissues': 'Anatomy & Clinical',
  'neuroscience': 'Anatomy & Clinical',
  'oncology': 'Anatomy & Clinical',
  'procedures': 'Anatomy & Clinical',
  'people-other': 'Anatomy & Clinical',
  'body': 'Anatomy & Clinical',
  'specialties': 'Anatomy & Clinical',
  'conditions': 'Anatomy & Clinical',
  'diagnostics': 'Anatomy & Clinical',
  'medications': 'Anatomy & Clinical',
  'contraceptives': 'Anatomy & Clinical',
  'nutrition': 'Anatomy & Clinical',
  'emotions': 'Anatomy & Clinical',
  'people': 'Anatomy & Clinical',
  'clinical': 'Anatomy & Clinical',

  // Chemistry & Labware
  'chemistry': 'Chemistry & Labware',
  'molecular_modelling': 'Chemistry & Labware',
  'molecular-modelling': 'Chemistry & Labware',
  'lab_apparatus': 'Chemistry & Labware',
  'lab-apparatus': 'Chemistry & Labware',
  'safety_symbols': 'Chemistry & Labware',
  'safety-symbols': 'Chemistry & Labware',
  'nanotechnology': 'Chemistry & Labware',
  'scientific_graphs': 'Chemistry & Labware',
  'scientific-graphs': 'Chemistry & Labware',
  'computer_hardware': 'Chemistry & Labware',
  'computer-hardware': 'Chemistry & Labware',
  'machine_learning': 'Chemistry & Labware',
  'machine-learning': 'Chemistry & Labware',
  'chemo-_and_bioinformatics': 'Chemistry & Labware',
  'general_items': 'Chemistry & Labware',
  'general-items': 'Chemistry & Labware',
  'imaging': 'Chemistry & Labware',
  'devices': 'Chemistry & Labware',
  'ppe': 'Chemistry & Labware',
  'objects': 'Chemistry & Labware',
  'symbols': 'Chemistry & Labware',
  'shapes': 'Chemistry & Labware',
  'vehicles': 'Chemistry & Labware',
  'places': 'Chemistry & Labware',
  'typography': 'Chemistry & Labware',
  'graphs': 'Chemistry & Labware',
  'exercise': 'Chemistry & Labware',
};

function formatTitle(name) {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\.svg$/i, '')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function sanitizeSvg(rawSvg) {
  if (!rawSvg) return null;
  let svg = rawSvg;

  // Strip xml header, doctype, and comments
  svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '');
  svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');

  // Strip scripts and inline handlers
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  svg = svg.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');

  // Find root <svg ...>
  const match = svg.match(/<svg([^>]*)>/i);
  if (!match) return null;

  let attrs = match[1];

  // Ensure xmlns
  if (!attrs.includes('xmlns=')) {
    attrs += ' xmlns="http://www.w3.org/2000/svg"';
  }

  // Ensure viewBox
  if (!attrs.includes('viewBox=')) {
    const widthMatch = attrs.match(/width="([^"]+)"/);
    const heightMatch = attrs.match(/height="([^"]+)"/);
    if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1]) || 48;
      const h = parseFloat(heightMatch[1]) || 48;
      attrs += ` viewBox="0 0 ${w} ${h}"`;
    } else {
      attrs += ' viewBox="0 0 48 48"';
    }
  }

  return svg.replace(/<svg[^>]*>/i, `<svg${attrs}>`).trim();
}

function walkDir(dir, filterExt = '.svg') {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath, filterExt));
    } else if (entry.name.endsWith(filterExt)) {
      files.push(fullPath);
    }
  }
  return files;
}

const manifest = [];
const seenIds = new Set();

function addAsset(asset, sourcePath, targetRelativePath) {
  if (seenIds.has(asset.id)) return;
  seenIds.add(asset.id);

  try {
    const raw = fs.readFileSync(sourcePath, 'utf8');
    const cleaned = sanitizeSvg(raw);
    if (!cleaned) return;

    const outFullPath = path.join(publicCatalogDir, targetRelativePath);
    fs.mkdirSync(path.dirname(outFullPath), { recursive: true });
    fs.writeFileSync(outFullPath, cleaned, 'utf8');

    asset.svgPath = '/catalog/' + targetRelativePath.replace(/\\/g, '/');
    manifest.push(asset);
  } catch (err) {
    console.warn(`Failed to process ${sourcePath}:`, err.message);
  }
}

// ----------------------------------------------------
// 1. Ingest Bioicons + Servier Medical Art
// ----------------------------------------------------
console.log('Ingesting Bioicons & Servier Medical Art...');
const bioiconsDir = path.join(rootDir, 'bioicons-main', 'static', 'icons');
let authorsMap = {};
try {
  authorsMap = JSON.parse(
    fs.readFileSync(path.join(bioiconsDir, 'authors.json'), 'utf8')
  );
} catch (e) {}

if (fs.existsSync(bioiconsDir)) {
  const bioiconFiles = walkDir(bioiconsDir, '.svg');
  console.log(`Found ${bioiconFiles.length} Bioicons SVGs on disk.`);

  for (const file of bioiconFiles) {
    const rel = path.relative(bioiconsDir, file);
    const parts = rel.split(path.sep);
    if (parts.length < 4) continue;

    const licenseFolder = parts[0]; // e.g. cc-0, cc-by-3.0, cc-by-4.0, mit, bsd
    const rawCategory = parts[1]; // e.g. Amino-Acids, Blood_Immunology
    const rawAuthor = parts[2]; // e.g. Servier, Derek-Croote
    const fileName = parts[parts.length - 1]; // e.g. alanine.svg
    const baseName = fileName.replace(/\.svg$/i, '');

    const catKey = rawCategory.toLowerCase();
    const category = CATEGORY_MAP[catKey] || 'Chemistry & Labware';

    let spdx = 'CC-BY-4.0';
    let attributionRequired = true;
    if (licenseFolder === 'cc-0') {
      spdx = 'CC0-1.0';
      attributionRequired = false;
    } else if (licenseFolder === 'cc-by-3.0') {
      spdx = 'CC-BY-3.0';
    } else if (licenseFolder === 'mit') {
      spdx = 'MIT';
      attributionRequired = false;
    } else if (licenseFolder === 'bsd') {
      spdx = 'BSD-3-Clause';
      attributionRequired = false;
    } else if (licenseFolder.includes('sa')) {
      spdx = licenseFolder.includes('4.0') ? 'CC-BY-SA-4.0' : 'CC-BY-SA-3.0';
    }

    const creatorName = rawAuthor.replace(/[_-]+/g, ' ');
    const authorUrl = authorsMap[rawAuthor] || authorsMap[creatorName] || 'https://bioicons.com';

    const cleanTitle = formatTitle(baseName);
    const tags = Array.from(
      new Set([
        ...cleanTitle.toLowerCase().split(/\s+/),
        rawCategory.toLowerCase().replace(/[_-]+/g, ' '),
        category.toLowerCase(),
        creatorName.toLowerCase(),
        'bioicons',
      ])
    ).filter((t) => t.length > 1);

    const id = `bioicons:${licenseFolder}-${rawCategory}-${rawAuthor}-${baseName}`
      .toLowerCase()
      .replace(/[^a-z0-9:-]/g, '_');

    const targetRel = path.join('svg', 'bioicons', rawCategory, fileName);

    addAsset(
      {
        id,
        name: cleanTitle,
        category,
        subCategory: formatTitle(rawCategory),
        tags,
        license: {
          spdx,
          creator: creatorName,
          sourceUrl: authorUrl,
          attributionRequired,
        },
      },
      file,
      targetRel
    );
  }
}

// ----------------------------------------------------
// 2. Ingest Health Icons (all styles)
// ----------------------------------------------------
console.log('Ingesting Health Icons...');
const healthiconsDir = path.join(
  rootDir,
  'node_modules',
  'healthicons',
  'public',
  'icons'
);
let healthMeta = [];
try {
  healthMeta = JSON.parse(
    fs.readFileSync(path.join(healthiconsDir, 'meta-data.json'), 'utf8')
  );
} catch (e) {}

const healthMetaMap = new Map();
for (const item of healthMeta) {
  healthMetaMap.set(item.id, item);
}

const healthSvgBase = path.join(healthiconsDir, 'svg');
if (fs.existsSync(healthSvgBase)) {
  const healthFiles = walkDir(healthSvgBase, '.svg');
  console.log(`Found ${healthFiles.length} Healthicons SVGs on disk.`);

  for (const file of healthFiles) {
    const rel = path.relative(healthSvgBase, file);
    const parts = rel.split(path.sep);
    if (parts.length < 3) continue;

    const style = parts[0]; // filled, outline, filled-24px, outline-24px
    const rawCategory = parts[1]; // blood, body, devices, etc.
    const fileName = parts[parts.length - 1];
    const iconId = fileName.replace(/\.svg$/i, '');

    const meta = healthMetaMap.get(iconId);
    const catKey = rawCategory.toLowerCase();
    const category = CATEGORY_MAP[catKey] || 'Anatomy & Clinical';

    const title = meta?.title || formatTitle(iconId);
    const styleLabel = style.includes('filled') ? ' (Filled)' : '';
    const name = `${title}${styleLabel}`;

    const tags = Array.from(
      new Set([
        ...title.toLowerCase().split(/\s+/),
        ...(meta?.tags || []).map((t) => t.toLowerCase()),
        rawCategory.toLowerCase(),
        category.toLowerCase(),
        'healthicons',
        style,
      ])
    ).filter((t) => t.length > 1);

    const id = `healthicons:${style}-${rawCategory}-${iconId}`
      .toLowerCase()
      .replace(/[^a-z0-9:-]/g, '_');

    const targetRel = path.join('svg', 'healthicons', style, rawCategory, fileName);

    addAsset(
      {
        id,
        name,
        category,
        subCategory: formatTitle(rawCategory),
        tags,
        license: {
          spdx: 'CC0-1.0',
          creator: 'Health Icons / Resolve to Save Lives',
          sourceUrl: 'https://healthicons.org/',
          attributionRequired: false,
        },
      },
      file,
      targetRel
    );
  }
}

// ----------------------------------------------------
// 3. Ingest Medic Icon Library
// ----------------------------------------------------
console.log('Ingesting Medic Icon Library...');
const medicDir = path.join(
  rootDir,
  'icon-library-master',
  'forms_tasks_targets',
  'SVGs'
);
if (fs.existsSync(medicDir)) {
  const medicFiles = walkDir(medicDir, '.svg');
  console.log(`Found ${medicFiles.length} Medic SVGs on disk.`);

  for (const file of medicFiles) {
    const fileName = path.basename(file);
    const baseName = fileName.replace(/\.svg$/i, '').replace(/^icon-/, '');
    const cleanTitle = formatTitle(baseName);

    const tags = Array.from(
      new Set([
        ...cleanTitle.toLowerCase().split(/\s+/),
        'medic',
        'clinical',
        'community health',
        'danger sign',
      ])
    ).filter((t) => t.length > 1);

    const id = `medic:${baseName.toLowerCase().replace(/[^a-z0-9:-]/g, '_')}`;
    const targetRel = path.join('svg', 'medic', fileName);

    addAsset(
      {
        id,
        name: cleanTitle,
        category: 'Anatomy & Clinical',
        subCategory: 'Clinical Conditions',
        tags,
        license: {
          spdx: 'Apache-2.0',
          creator: 'Medic Mobile',
          sourceUrl: 'https://github.com/medic/icon-library',
          attributionRequired: true,
        },
      },
      file,
      targetRel
    );
  }
}

// ----------------------------------------------------
// 4. Ingest Lucide Labware & Science Icons
// ----------------------------------------------------
console.log('Ingesting Lucide Science & Labware Icons...');
const lucideDir = path.join(
  rootDir,
  'node_modules',
  'lucide-react',
  'dist',
  'esm',
  'icons'
);

if (fs.existsSync(lucideDir)) {
  const lucideFiles = fs
    .readdirSync(lucideDir)
    .filter((f) => f.endsWith('.mjs') && !f.endsWith('.map'));

  const lucideTargetDir = path.join(publicCatalogDir, 'svg', 'lucide');
  fs.mkdirSync(lucideTargetDir, { recursive: true });

  let lucideCount = 0;
  for (const file of lucideFiles) {
    const baseName = file.replace(/\.mjs$/i, '');
    const filePath = path.join(lucideDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/const __iconData = (\{[\s\S]*?\n\});/);
      if (!match) continue;

      const data = eval('(' + match[1] + ')');
      if (!data || !Array.isArray(data.node)) continue;

      // Category heuristic for Lucide icons
      const n = baseName.toLowerCase();
      let category = 'Chemistry & Labware';
      if (
        n.includes('dna') ||
        n.includes('gene') ||
        n.includes('code') ||
        n.includes('binary')
      ) {
        category = 'Genetics';
      } else if (
        n.includes('heart') ||
        n.includes('bone') ||
        n.includes('brain') ||
        n.includes('eye') ||
        n.includes('ear') ||
        n.includes('hospital') ||
        n.includes('pill') ||
        n.includes('stethoscope') ||
        n.includes('thermometer') ||
        n.includes('activity') ||
        n.includes('pulse')
      ) {
        category = 'Anatomy & Clinical';
      } else if (n.includes('shield') || n.includes('cross') || n.includes('protect')) {
        category = 'Immunology';
      } else if (n.includes('bug') || n.includes('virus') || n.includes('worm')) {
        category = 'Microbiology';
      } else if (
        n.includes('circle') ||
        n.includes('cell') ||
        n.includes('square') ||
        n.includes('layers')
      ) {
        category = 'Cell Biology';
      }

      const innerNodes = data.node
        .map(([tag, attrs]) => {
          const attrStr = Object.entries(attrs)
            .filter(([k]) => k !== 'key')
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
          return `<${tag} ${attrStr} />`;
        })
        .join('');

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${innerNodes}</svg>`;

      const svgFileName = `${baseName}.svg`;
      const svgFullPath = path.join(lucideTargetDir, svgFileName);
      fs.writeFileSync(svgFullPath, svgContent, 'utf8');

      const cleanTitle = formatTitle(baseName);
      const tags = Array.from(
        new Set([
          ...cleanTitle.toLowerCase().split(/\s+/),
          'lucide',
          'labware',
          'instrument',
          category.toLowerCase(),
        ])
      );

      const id = `lucide:${baseName.toLowerCase().replace(/[^a-z0-9:-]/g, '_')}`;

      if (!seenIds.has(id)) {
        seenIds.add(id);
        manifest.push({
          id,
          name: cleanTitle,
          category,
          subCategory: 'Laboratory & UI',
          tags,
          svgPath: `/catalog/svg/lucide/${svgFileName}`,
          license: {
            spdx: 'ISC',
            creator: 'Lucide Project',
            sourceUrl: 'https://lucide.dev',
            attributionRequired: false,
          },
        });
        lucideCount++;
      }
    } catch (e) {}
  }
  console.log(`Ingested ${lucideCount} Lucide laboratory & diagram icons.`);
}

// ----------------------------------------------------
// Sort & Save Manifest
// ----------------------------------------------------
manifest.sort((a, b) => {
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category);
  }
  return a.name.localeCompare(b.name);
});

const manifestPath = path.join(publicCatalogDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log('\n=============================================');
console.log(`TOTAL SCIENTIFIC ASSETS INGESTED: ${manifest.length}`);
console.log('=============================================');

// Category breakdown
const breakdown = {};
for (const item of manifest) {
  breakdown[item.category] = (breakdown[item.category] || 0) + 1;
}
console.log('Category breakdown:');
console.table(breakdown);
