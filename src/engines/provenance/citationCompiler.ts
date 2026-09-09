import { Canvas, Group } from 'fabric';

export interface CitationItem {
  name: string;
  category?: string;
  creator: string;
  spdx: string;
  sourceUrl?: string;
  attributionRequired: boolean;
}

export interface CitationReport {
  markdown: string;
  plainText: string;
  items: CitationItem[];
  hasAttributions: boolean;
}

export function compileManuscriptCitations(canvas: Canvas): CitationReport {
  const objects = canvas.getObjects();
  const itemMap = new Map<string, CitationItem>();

  function processObject(obj: any) {
    if (obj.scientificMeta) {
      const meta = obj.scientificMeta;
      const name = meta.name || 'Scientific Illustration';
      const license = meta.license || {};
      const spdx = license.spdx || 'CC0-1.0';
      const creator = license.creator || 'OpenBioFigure';
      const sourceUrl = license.sourceUrl || '';
      const attributionRequired = license.attributionRequired ?? (spdx.includes('BY') || spdx.includes('MIT'));

      if (!itemMap.has(name)) {
        itemMap.set(name, {
          name,
          category: meta.category,
          creator,
          spdx,
          sourceUrl,
          attributionRequired,
        });
      }
    }

    if (obj instanceof Group) {
      obj.forEachObject?.((child: any) => processObject(child));
    }
  }

  objects.forEach(processObject);

  const items = Array.from(itemMap.values());
  const attributionItems = items.filter((item) => item.attributionRequired);
  const hasAttributions = attributionItems.length > 0;

  let markdown = '';
  let plainText = '';

  if (items.length === 0) {
    markdown =
      'All figure assets were generated using public domain (CC0) vectors or created natively by the authors. No formal attribution is required.';
    plainText = markdown;
  } else if (!hasAttributions) {
    markdown =
      'All figure assets were generated using public domain (CC0) vectors or created natively by the authors. No formal attribution is required.';
    plainText = markdown;
  } else {
    markdown = '### Figure Asset Attribution & Provenance\n';
    markdown +=
      'The authors acknowledge the following open-source scientific illustrations and vector assets used in this figure:\n\n';

    plainText = 'Figure Asset Attribution & Provenance\n';
    plainText +=
      'The authors acknowledge the following open-source scientific illustrations and vector assets used in this figure:\n\n';

    for (const item of attributionItems) {
      const sourceSuffix = item.sourceUrl ? ` (${item.sourceUrl})` : '';
      markdown += `- **${item.name}**: Created by ${item.creator}, licensed under ${item.spdx}${sourceSuffix}.\n`;
      plainText += `• ${item.name}: Created by ${item.creator}, licensed under ${item.spdx}${sourceSuffix}.\n`;
    }
  }

  return {
    markdown,
    plainText,
    items,
    hasAttributions,
  };
}
