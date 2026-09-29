'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { totalsByWeekday } from '../../utils/analytics';
import { formatBRL } from '../../utils/currency';
import { Period } from '../../utils/date';
import { BarChart } from './BarChart';
import { ExpenseList } from './ExpenseList';

type Props = {
  expenses: Expense[];
  date: Date;
  period: Period;
  onOpen: (expense: Expense) => void;
};

/**
 * Por dia da semana, pela MÉDIA por dia: um mês com cinco sábados não faz o
 * sábado parecer caro só por ter aparecido mais vezes.
 */
export function WeekdayView({ expenses, date, period, onOpen }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [date, period]);

  const days = useMemo(() => totalsByWeekday(expenses, date, period), [expenses, date, period]);
  const avg = (d: (typeof days)[number]) => (d.days > 0 ? d.total / d.days : d.total);
  const top = days.reduce((best, d) => (avg(d) > avg(best) ? d : best), days[0]);
  const chosen = days.find((d) => String(d.weekday) === selected);

  return (
    <div className="space-y-4">
      {top && top.total > 0 && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: colors.primarySoft }}>
          <div className="text-lg font-extrabold" style={{ color: colors.text }}>
            {t.views.mostSpentWeekday(t.views.weekdaysLong[top.weekday])}
          </div>
          <div className="text-sm" style={{ color: colors.textMuted }}>
            {t.views.avgPerDay(formatBRL(avg(top)))}
          </div>
        </div>
      )}

      <div className="rounded-3xl p-5" style={{ backgroundColor: colors.card }}>
        <BarChart
          bars={days.map((d) => ({
            key: String(d.weekday),
            value: avg(d),
            label: t.views.weekdaysShort[d.weekday],
            title: t.views.avgPerDay(formatBRL(avg(d))),
          }))}
          selectedKey={selected}
          onSelect={setSelected}
          color={colors.primary}
        />
        {!chosen && (
          <p className="mt-3 text-center text-xs" style={{ color: colors.textMuted }}>
            {t.views.tapBar}
          </p>
        )}
      </div>

      {chosen && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold" style={{ color: colors.text }}>
                {t.views.weekdaysShort[chosen.weekday]}
              </h2>
              <div className="text-sm" style={{ color: colors.textMuted }}>
                {t.views.avgPerDay(formatBRL(avg(chosen)))}
              </div>
            </div>
            <span className="text-lg font-extrabold" style={{ color: colors.text }}>
              {formatBRL(chosen.total)}
            </span>
          </div>
          <ExpenseList expenses={chosen.expenses} onOpen={onOpen} />
        </div>
      )}
    </div>
  );
}
