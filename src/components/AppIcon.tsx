import { BRAND_ICONS } from '../data/brandIcons';
import { emojiChar, isEmojiIcon } from '../data/emojis';
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

/** Renderiza um ícone (emoji, marca ou MDI) no tamanho pedido. */
export function AppIcon({ icon, size = 24, color = 'currentColor', className }: Props) {
  // Emoji tem cor própria; `color` não se aplica.
  if (isEmojiIcon(icon)) {
    return (
      <span
        className={className}
        style={{
          fontSize: size * 0.86,
          lineHeight: `${size}px`,
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {emojiChar(icon)}
      </span>
    );
  }

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
