import { BRAND_ICONS } from '../data/brandIcons';
import { FALLBACK_ICON, ICON_PATHS } from '../data/iconPaths';

type Props = {
  /** Nome do ícone: glyph do MDI ("silverware-fork-knife") ou "brand:<marca>". */
  icon: string;
  size?: number;
  color?: string;
  className?: string;
};

function resolvePath(icon: string): string {
  if (icon.startsWith('brand:')) {
    const brand = BRAND_ICONS[icon.slice(6)];
    if (brand) return brand.path;
  }
  return ICON_PATHS[icon] ?? FALLBACK_ICON;
}

/** Renderiza um ícone (MDI ou marca) como SVG 24x24. */
export function AppIcon({ icon, size = 24, color = 'currentColor', className }: Props) {
  const path = resolvePath(icon);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path d={path} fill={color} />
    </svg>
  );
}
