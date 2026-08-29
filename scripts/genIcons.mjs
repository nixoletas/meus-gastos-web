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

// Ampliação do catálogo: genéricos do dia a dia, nuvem/SaaS e logos de marca
// que existem como glyph do MDI (os demais vêm do simple-icons em brandIcons.ts).
const CATALOG_EXTRA = [
  'food-apple', 'food-croissant', 'food-drumstick', 'food-steak', 'fruit-grapes',
  'fruit-watermelon', 'fruit-pineapple', 'corn', 'mushroom', 'peanut', 'baguette', 'candy',
  'cookie', 'popcorn', 'tea', 'bottle-soda', 'cup-water', 'barley', 'silverware-clean',
  'bus-school', 'bus-stop', 'car-electric', 'car-wash', 'ev-station', 'truck', 'truck-fast',
  'van-utility', 'tram', 'rickshaw', 'walk', 'run', 'road-variant', 'traffic-light', 'car-key',
  'car-seat', 'steering', 'home-heart', 'home-plus', 'home-search', 'stairs', 'elevator',
  'window-closed', 'curtains', 'floor-lamp', 'ceiling-light', 'lamp', 'shower-head', 'toilet',
  'vacuum', 'iron', 'hammer-screwdriver', 'ladder', 'format-paint', 'pipe-wrench',
  'water-well', 'pill-multiple', 'heart-plus', 'hospital', 'ambulance', 'dna', 'microscope',
  'thermometer', 'virus', 'toothbrush', 'hair-dryer', 'scissors-cutting', 'face-man-shimmer',
  'lotion', 'sunglasses', 'bag-checked', 'notebook', 'pencil-ruler', 'abacus', 'library',
  'ticket-account', 'basketball-hoop', 'volleyball', 'football', 'golf', 'bowling', 'karate',
  'boxing-glove', 'weight-lifter', 'bike-fast', 'rowing', 'surfing', 'kabaddi', 'table-tennis',
  'airplane-takeoff', 'bag-suitcase', 'map-marker', 'compass', 'island', 'pine-tree',
  'binoculars', 'camera-outline', 'ticket-confirmation', 'bed-king', 'city', 'wallet-travel',
  'credit-card-plus', 'credit-card-clock', 'card-account-details', 'file-percent', 'finance',
  'chart-timeline-variant', 'trending-up', 'trending-down', 'swap-horizontal', 'transfer',
  'cash-check', 'cash-minus', 'cash-plus', 'cash-register', 'ticket-percent', 'label-percent',
  'briefcase-clock', 'file-sign', 'folder-account', 'clipboard-text', 'presentation',
  'phone-in-talk', 'mail', 'office-building', 'handshake-outline', 'account-tie',
  'card-account-mail', 'cellphone-link', 'router-wireless', 'access-point', 'usb-flash-drive',
  'sd', 'ethernet', 'printer-3d', 'gamepad-square', 'disc', 'camera-wireless', 'cast',
  'speaker', 'headset', 'keyboard', 'mouse', 'shape-outline', 'circle-outline',
  'square-outline', 'triangle-outline', 'hexagon-outline', 'rhombus-outline',
  'octagon-outline', 'star-outline', 'heart-outline', 'bookmark-outline', 'flag-variant',
  'label-outline', 'checkbox-marked-circle', 'alert-decagram', 'plus-circle', 'minus-circle',
  'infinity', 'puzzle', 'palette-swatch', 'shimmer',
  'aws', 'microsoft-azure', 'google-cloud', 'digital-ocean', 'firebase', 'github', 'gitlab',
  'bitbucket', 'docker', 'npm', 'jira', 'atlassian', 'slack', 'salesforce', 'hubspot',
  'trello', 'evernote', 'onepassword', 'google-drive', 'gmail', 'box', 'wordpress',
  'soundcloud', 'steam', 'nintendo-switch', 'linkedin', 'patreon', 'fish', 'egg', 'cheese',
  'fruit-cherries', 'carrot', 'rice', 'bottle-wine', 'glass-cocktail', 'silverware-spoon',
  'silverware-variant', 'scooter', 'ferry', 'train-car', 'fuel', 'oil', 'car-battery',
  'engine', 'sail-boat', 'washing-machine', 'fridge', 'stove', 'air-conditioner',
  'solar-power', 'lightning-bolt', 'candle', 'flower', 'tree', 'wallet', 'cash-fast',
  'cash-lock', 'bank-transfer', 'currency-brl', 'currency-usd', 'calculator', 'hand-coin',
  'safe-square', 'piggy-bank-outline', 'receipt-text', 'sale', 'chart-bar', 'chart-pie',
  'chart-areaspline', 'scale', 'gavel', 'tag-multiple', 'cart-variant', 'truck-delivery',
  'package-variant', 'warehouse', 'store', 'storefront', 'needle', 'bandage', 'stethoscope',
  'wheelchair', 'eye-outline', 'ear-hearing', 'brain', 'yoga', 'theater', 'music-note',
  'microphone', 'podcast', 'book', 'newspaper', 'radio', 'television', 'filmstrip',
  'cards-playing', 'soccer', 'basketball', 'tennis', 'swim', 'ski', 'hiking', 'tent', 'server',
  'server-network', 'database', 'cloud-upload', 'cloud-download', 'api', 'code-braces', 'web',
  'domain', 'monitor', 'tablet', 'harddisk', 'memory', 'cpu-64-bit', 'robot', 'key-variant',
  'shield-lock', 'vpn', 'email', 'at', 'cellphone-charging', 'lightbulb-on', 'baby',
  'human-cane', 'school-outline', 'bird', 'rabbit', 'horse', 'account-group', 'handshake',
  'charity', 'church', 'briefcase-account', 'calendar-check', 'calendar-clock',
  'clock-outline', 'timer-outline', 'passport', 'shield-account',
];

// Ícones das categorias padrão (defaultCategories.ts) que não estão no catálogo.
const DEFAULTS = ['star-circle', 'package-variant-closed', 'microsoft', 'microsoft-xbox', 'shape'];

// Ícones usados na interface (navegação, botões, estados).
const UI = [
  'home', 'shape', 'target', 'chart-donut', 'cog', 'plus', 'account', 'pencil',
  'trash-can-outline', 'message-text-outline', 'email-outline', 'shield-lock-outline',
  'file-document-outline', 'information-outline', 'open-in-new', 'chevron-right',
  'chevron-up', 'chevron-down', 'chevron-left', 'calendar-month', 'calendar-today',
  'logout', 'account-remove', 'white-balance-sunny', 'weather-night', 'laptop',
  'cash-multiple', 'dots-horizontal', 'emoticon-happy-outline', 'loading', 'tag',
  'eye', 'eye-off', 'file-excel', 'calendar-blank-multiple', 'email-fast', 'download',
  'translate', 'alphabetical-variant',
];

const names = [...new Set([...CATALOG, ...CATALOG_EXTRA, ...DEFAULTS, ...UI])].sort();

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
