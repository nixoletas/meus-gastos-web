'use client';

import { useT } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { ExpenseRow } from '../ExpenseRow';

type Props = {
  expenses: Expense[];
  onOpen: (expense: Expense) => void;
  /** Mostra a data em cada linha (lista fora de um dia específico). */
  showDates?: boolean;
};

/** Lista de lançamentos num cartão — o fim de toda visualização. */
export function ExpenseList({ expenses, onOpen, showDates = true }: Props) {
  const { colors } = useTheme();
  const t = useT();

  if (expenses.length === 0) {
    return (
      <p className="py-4 text-center text-sm" style={{ color: colors.textMuted }}>
        {t.views.noExpensesThere}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
      {expenses.map((e, i) => (
        <ExpenseRow key={e.id} expense={e} first={i === 0} showDate={showDates} onClick={() => onOpen(e)} />
      ))}
    </div>
  );
}
