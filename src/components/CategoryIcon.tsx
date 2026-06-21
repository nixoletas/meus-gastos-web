import { AppIcon } from './AppIcon';

type Props = {
  icon: string;
  color: string;
  size?: number;
  /** Fundo sólido na cor; senão fundo suave translúcido. */
  solid?: boolean;
};

/** Badge circular com o ícone da categoria. */
export function CategoryIcon({ icon, color, size = 44, solid = false }: Props) {
  const iconSize = Math.round(size * 0.52);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: solid ? color : hexWithAlpha(color, 0.16),
      }}
    >
      <AppIcon icon={icon} size={iconSize} color={solid ? '#FFFFFF' : color} />
    </div>
  );
}

/** Converte #RRGGBB + alpha (0..1) em rgba(). */
export function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
