// Génération des PNG 192/512/1024 + apple-touch-icon 180 depuis assets/icon.svg.
// Usage : npm run icons
//
// resvg charge les fonts système (loadSystemFonts: true). Sur macOS ça donne
// Times New Roman italic pour l'Ω, ce qui suffit visuellement à 512×512 pour
// une icône d'app (proche de l'EB Garamond italique sans embed du fichier font).

import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'assets');

const svgFor = (size) => {
  const radius = Math.round(size * 112 / 512);
  const fontSize = Math.round(size * 0.625);
  const yPos = Math.round(size * 0.665);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="#0D0F0E"/>
    <text x="${size / 2}" y="${yPos}"
          text-anchor="middle"
          font-family="Times New Roman, Georgia, serif"
          font-style="italic"
          font-weight="400"
          font-size="${fontSize}"
          fill="#E8A020">Ω</text>
  </svg>`;
};

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 1024, name: 'icon-1024.png' },
  { size: 180, name: 'icon-180.png' },
];

for (const { size, name } of sizes) {
  const resvg = new Resvg(svgFor(size), {
    fitTo: { mode: 'width', value: size },
    background: '#0D0F0E',
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Times New Roman',
      serifFamily: 'Times New Roman',
    },
  });
  const png = resvg.render().asPng();
  await writeFile(join(ASSETS, name), png);
  console.log(`✓ ${name} (${png.length} bytes)`);
}
