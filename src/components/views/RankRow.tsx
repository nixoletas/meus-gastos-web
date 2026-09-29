'use client';

import { useTheme } from '../../theme/ThemeContext';
import { formatBRL } from '../../utils/currency';
import { AppIcon } from '../AppIcon';

type Props = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  total: number;
  percent: number;
  color: string;
  expanded: boolean;
  dimmed?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
};

/** Linha de ranking: ícone, nome, valor e barra de participação; abre o detalhe. */
export function RankRow({
  icon,
  title,
  subtitle,
  total,
  percent,
  color,
  expanded,
  dimmed,
  onClick,
  children,
}: Props) {
  const { colors } = useTheme();
  return (
    <div
      className="overflow-hidden rounded-2xl transition"
      style={{
        backgroundColor: colors.card,
        outline: expanded ? `2px solid ${color}` : 'none',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <button onClick={onClick} className="flex w-full items-center gap-3 p-3 text-left transition hover:opacity-90">
        {icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold" style={{ color: colors.text }}>
              {title}
            </span>
            <span className="shrink-0 font-bold" style={{ color: colors.text }}>
              {formatBRL(total)}
            </span>
          </div>
          {subtitle && (
            <div className="truncate text-xs" style={{ color: colors.textMuted }}>
              {subtitle}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: colors.surface }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(percent * 100, 3)}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-9 text-right text-xs font-semibold" style={{ color: colors.textMuted }}>
              {Math.round(percent * 100)}%
            </span>
          </div>
        </div>
        <AppIcon icon={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </button>
      {expanded && children && (
        <div className="space-y-2 p-3" style={{ borderTop: `1px solid ${colors.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
}
