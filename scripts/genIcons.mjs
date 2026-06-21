// Gera src/data/iconPaths.ts com APENAS os ícones usados pelo app, embutindo os
// paths SVG como strings literais (sem importar @mdi/js em runtime).
// Rode com: npm run gen:icons
import * as mdi from '@mdi/js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ícones do catálogo de categorias (data/icons.ts) — sem os "brand:".
const CATALOG = [
  'silverware-fork-knife', 'food', 'hamburger', 'pizza', 'coffee', 'cup', 'beer',
  'cart', 'cart-outline', 'basket', 'cupcake', 'bread-slice', 'ice-cream', 'noodles',
  'car', 'car-hatchback', 'gas-station', 'bus', 'train', 'subway-variant', 'taxi',
  'motorbike', 'bicycle', 'airplane', 'parking', 'car-wrench', 'highway',
  'home', 'home-city', 'sofa', 'bed', 'lightbulb', 'flash', 'water', 'fire', 'broom',
  'tools', 'hammer-wrench', 'wifi', 'file-document', 'cash', 'credit-card', 'bank',
  'percent', 'chart-line', 'piggy-bank', 'receipt', 'scale-balance', 'heart-pulse',
  'medical-bag', 'pill', 'hospital-box', 'tooth', 'glasses', 'dumbbell', 'meditation',
  'human-male-female', 'movie-open', 'television-classic', 'music', 'gamepad-variant',
  'controller-classic', 'ticket', 'party-popper', 'book-open-variant', 'palette',
  'guitar-acoustic', 'beach', 'camera', 'tshirt-crew', 'shoe-heel', 'shoe-sneaker',
  'shopping', 'hanger', 'watch', 'ring', 'bag-personal', 'cellphone', 'laptop',
  'headphones', 'application', 'cloud', 'school', 'book-education', 'pencil',
  'certificate', 'baby-carriage', 'paw', 'dog', 'cat', 'gift', 'human-greeting',
  'hand-heart', 'content-cut', 'spray', 'lipstick', 'face-woman-shimmer', 'briefcase',
  'printer', 'dots-horizontal', 'tag', 'star', 'shield-check', 'umbrella',
];

// Ícones das categorias padrão (defaultCategories.ts) que não estão no catálogo.
const DEFAULTS = ['star-circle', 'package-variant-closed', 'microsoft', 'microsoft-xbox', 'shape'];

// Ícones usados na interface (navegação, botões, estados).
const UI = [
  'home', 'shape', 'target', 'chart-donut', 'cog', 'plus', 'account', 'pencil',
  'trash-can-outline', 'message-text-outline', 'email-outline', 'shield-lock-outline',
  'file-document-outline', 'information-outline', 'open-in-new', 'chevron-right',
  'logout', 'account-remove', 'white-balance-sunny', 'weather-night', 'laptop',
  'cash-multiple', 'dots-horizontal', 'emoticon-happy-outline', 'loading', 'tag',
];

const names = [...new Set([...CATALOG, ...DEFAULTS, ...UI])].sort();

function toMdiKey(name) {
  const pascal = name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  return `mdi${pascal}`;
}

const entries = [];
const missing = [];
for (const name of names) {
  const path = mdi[toMdiKey(name)];
  if (typeof path === 'string') entries.push([name, path]);
  else missing.push(name);
}

if (missing.length) {
  console.warn('⚠ Ícones não encontrados em @mdi/js (usarão fallback):', missing.join(', '));
}

const body =
  `// GERADO por scripts/genIcons.mjs — não edite à mão. Rode: npm run gen:icons\n` +
  `// Paths SVG (MDI) embutidos, só dos ícones usados, pra manter o bundle leve.\n\n` +
  `export const ICON_PATHS: Record<string, string> = {\n` +
  entries.map(([n, p]) => `  ${JSON.stringify(n)}: ${JSON.stringify(p)},`).join('\n') +
  `\n};\n\n` +
  `/** Fallback quando o ícone não está no mapa. */\n` +
  `export const FALLBACK_ICON = ${JSON.stringify(mdi.mdiTag)};\n`;

const out = join(__dirname, '..', 'src', 'data', 'iconPaths.ts');
writeFileSync(out, body);
console.log(`✓ ${entries.length} ícones gravados em src/data/iconPaths.ts`);
