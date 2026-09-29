'use client';

import { useTheme } from '../../theme/ThemeContext';
import { hexWithAlpha } from '../CategoryIcon';

export type Bar = {
  key: string;
  value: number;
  /** Rótulo embaixo da barra; vazio esconde (útil com 31 dias). */
  label?: string;
  /** Texto do tooltip nativo ao passar o mouse. */
  title?: string;
  /** Período que ainda não chegou: barra apagada e sem clique. */
  disabled?: boolean;
};

type Props = {
  bars: Bar[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  color: string;
  height?: number;
  /** Linha tracejada de referência (ex.: média). */
  reference?: number;
};

/** Barras verticais em HTML puro: cada barra é o próprio botão. */
export function BarChart({ bars, selectedKey, onSelect, color, height = 200, reference }: Props) {
  const { colors } = useTheme();
  const max = Math.max(...bars.map((b) => b.value), reference ?? 0, 0);
  const gap = bars.length > 20 ? 3 : bars.length > 10 ? 6 : 12;

  return (
    <div>
      <div className="relative flex items-end" style={{ height, gap }}>
        {reference != null && reference > 0 && max > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed opacity-60"
            style={{ bottom: (reference / max) * height, borderColor: colors.textMuted }}
          />
        )}
        {bars.map((b) => {
          const active = selectedKey === b.key;
          const dimmed = selectedKey !== null && !active;
          const h = max > 0 ? Math.max((b.value / max) * height, b.value > 0 ? 3 : 0) : 0;
          return (
            <button
              key={b.key}
              type="button"
              title={b.title}
              disabled={b.disabled}
              onClick={() => onSelect(active ? null : b.key)}
              className="flex h-full flex-1 flex-col justify-end transition hover:opacity-80 disabled:cursor-default"
            >
              <span
                className="block w-full transition-all"
                style={{
                  height: h || 2,
                  borderRadius: bars.length > 20 ? 3 : 6,
                  backgroundColor: b.disabled
                    ? colors.surface
                    : h === 0
                      ? colors.border
                      : dimmed
                        ? hexWithAlpha(color, 0.3)
                        : color,
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex" style={{ gap }}>
        {bars.map((b) => (
          <div
            key={b.key}
            className="flex-1 overflow-visible whitespace-nowrap text-center text-[10px]"
            style={{
              color: selectedKey === b.key ? colors.text : colors.textMuted,
              fontWeight: selectedKey === b.key ? 800 : 600,
            }}
          >
            {b.label ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}
