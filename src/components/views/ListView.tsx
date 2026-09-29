'use client';

import { useMemo, useState } from 'react';
import { useT } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { expensesForPeriod } from '../../utils/analytics';
import { Period } from '../../utils/date';
import { ExpenseList } from './ExpenseList';

type Props = {
  expenses: Expense[];
  date: Date;
  period: Period;
  onOpen: (expense: Expense) => void;
};

type Sort = 'recent' | 'biggest';

/** Todos os lançamentos do período, por data ou do maior para o menor. */
export function ListView({ expenses, date, period, onOpen }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [sort, setSort] = useState<Sort>('recent');

  const list = useMemo(() => {
    const items = expensesForPeriod(expenses, date, period);
    return sort === 'biggest' ? [...items].sort((a, b) => b.amount - a.amount) : items;
  }, [expenses, date, period, sort]);

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: colors.surface }}>
        {(['recent', 'biggest'] as Sort[]).map((s) => {
          const active = sort === s;
          return (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="rounded-lg px-4 py-1.5 text-sm font-bold transition"
              style={{
                backgroundColor: active ? colors.card : 'transparent',
                color: active ? colors.primary : colors.textMuted,
              }}
            >
              {s === 'recent' ? t.views.sortRecent : t.views.sortBiggest}
            </button>
          );
        })}
      </div>
      <ExpenseList expenses={list} onOpen={onOpen} />
    </div>
  );
}
