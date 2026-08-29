'use client';

import { useT } from '../i18n';
import { Period, periodLabel, shiftPeriod } from '../utils/date';
import { useTheme } from '../theme/ThemeContext';
import { hexWithAlpha } from './CategoryIcon';

type Props = {
  date: Date;
  period: Period;
  onChangeDate: (d: Date) => void;
  onChangePeriod: (p: Period) => void;
};

export function PeriodSwitcher({ date, period, onChangeDate, onChangePeriod }: Props) {
  const { colors } = useTheme();
  const t = useT();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex items-center gap-1 rounded-full p-1"
        style={{ backgroundColor: colors.surface }}
      >
        <button
          onClick={() => onChangeDate(shiftPeriod(date, period, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold transition hover:opacity-70"
          style={{ color: colors.text }}
          aria-label={t.web.previous}
        >
          ‹
        </button>
        <span
          className="min-w-[150px] text-center text-sm font-bold capitalize"
          style={{ color: colors.text }}
        >
          {periodLabel(date, period)}
        </span>
        <button
          onClick={() => onChangeDate(shiftPeriod(date, period, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold transition hover:opacity-70"
          style={{ color: colors.text }}
          aria-label={t.web.next}
        >
          ›
        </button>
      </div>

      <div
        className="flex items-center gap-1 rounded-full p-1"
        style={{ backgroundColor: colors.surface }}
      >
        {(['month', 'year'] as Period[]).map((p) => {
          const active = period === p;
          return (
            <button
              key={p}
              onClick={() => onChangePeriod(p)}
              className="rounded-full px-4 py-1.5 text-sm font-bold transition"
              style={{
                backgroundColor: active ? hexWithAlpha(colors.primary, 0.16) : 'transparent',
                color: active ? colors.primary : colors.textMuted,
              }}
            >
              {p === 'month' ? t.common.month : t.common.year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
