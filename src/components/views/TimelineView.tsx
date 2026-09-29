'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { timelineBuckets } from '../../utils/analytics';
import { formatBRL } from '../../utils/currency';
import { monthName, Period, shortMonthName } from '../../utils/date';
import { BarChart } from './BarChart';
import { ExpenseList } from './ExpenseList';

type Props = {
  expenses: Expense[];
  date: Date;
  period: Period;
  onOpen: (expense: Expense) => void;
};

/** Linha do tempo: gasto por dia (mês) ou por mês (ano), com média e picos. */
export function TimelineView({ expenses, date, period, onOpen }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [date, period]);

  const buckets = useMemo(() => timelineBuckets(expenses, date, period), [expenses, date, period]);

  const past = buckets.filter((b) => !b.future);
  const total = past.reduce((s, b) => s + b.total, 0);
  const average = past.length > 0 ? total / past.length : 0;
  const peak = buckets.reduce((best, b) => (b.total > best.total ? b : best), buckets[0]);
  const withoutSpending = past.filter((b) => b.total === 0).length;

  const labelFor = (index: number) =>
    period === 'year' ? monthName(index) : `${index} ${shortMonthName(date.getMonth())}`;

  const bars = buckets.map((b) => ({
    key: String(b.index),
    value: b.total,
    disabled: b.future && b.total === 0,
    title: `${labelFor(b.index)} · ${formatBRL(b.total)}`,
    label:
      period === 'year'
        ? shortMonthName(b.index)
        : b.index === 1 || b.index % 5 === 0
          ? String(b.index)
          : '',
  }));

  const chosen = buckets.find((b) => String(b.index) === selected);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={period === 'year' ? t.views.monthlyAvg : t.views.dailyAvg} value={formatBRL(average)} />
        {peak && peak.total > 0 && (
          <Stat
            label={period === 'year' ? t.views.peakMonth : t.views.peakDay}
            value={labelFor(peak.index)}
            sub={formatBRL(peak.total)}
          />
        )}
        {period === 'month' && (
          <Stat label={t.views.daysWithout} value={`${withoutSpending}/${past.length}`} />
        )}
      </div>

      <div className="rounded-3xl p-5" style={{ backgroundColor: colors.card }}>
        <BarChart bars={bars} selectedKey={selected} onSelect={setSelected} color={colors.primary} reference={average} />
        {!chosen && (
          <p className="mt-3 text-center text-xs" style={{ color: colors.textMuted }}>
            {t.views.tapBar}
          </p>
        )}
      </div>

      {chosen && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold" style={{ color: colors.text }}>
              {period === 'year' ? monthName(chosen.index) : t.views.dayTitle(labelFor(chosen.index))}
            </h2>
            <span className="text-lg font-extrabold" style={{ color: colors.text }}>
              {formatBRL(chosen.total)}
            </span>
          </div>
          <ExpenseList expenses={chosen.expenses} onOpen={onOpen} showDates={period === 'year'} />
        </div>
      )}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const { colors } = useTheme();
  return (
    <div className="min-w-0 rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
      <div className="truncate text-xs font-semibold" style={{ color: colors.textMuted }}>
        {label}
      </div>
      <div className="truncate text-lg font-extrabold" style={{ color: colors.text }}>
        {value}
      </div>
      {sub && (
        <div className="truncate text-xs" style={{ color: colors.textMuted }}>
          {sub}
        </div>
      )}
    </div>
  );
}
