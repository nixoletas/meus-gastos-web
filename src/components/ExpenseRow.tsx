'use client';

import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { Expense } from '../types';
import { formatBRL } from '../utils/currency';
import { relativeDayLabel } from '../utils/date';
import { CategoryIcon } from './CategoryIcon';
import { PaymentLogo } from './PaymentLogo';

type Props = {
  expense: Expense;
  onClick: () => void;
  /** Linha de cima do grupo não leva divisória. */
  first?: boolean;
  /** Mostra a data (listas que não agrupam por dia). */
  showDate?: boolean;
};

/** Linha de um gasto: categoria, nota · lugar, badge da notinha, logo do pagamento e valor. */
export function ExpenseRow({ expense: e, onClick, first = true, showDate = false }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const { getCategory, getPaymentMethod } = useData();

  const cat = getCategory(e.subcategory_id) ?? getCategory(e.category_id);
  const parent = cat?.parent_id ? getCategory(cat.parent_id) : cat;
  const payment = getPaymentMethod(e.payment_method_id);
  const secondary = [e.note?.trim(), e.place?.trim(), showDate ? relativeDayLabel(e.occurred_at) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:opacity-80"
      style={{ borderTop: first ? undefined : `1px solid ${colors.border}` }}
    >
      <CategoryIcon icon={cat?.icon ?? 'tag'} color={parent?.color ?? colors.textMuted} size={42} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold" style={{ color: colors.text }}>
          {cat?.name ?? t.common.noCategory}
        </div>
        {(secondary || e.items_count > 0 || e.has_receipt) && (
          <div className="flex items-center gap-2 text-sm" style={{ color: colors.textMuted }}>
            {secondary && <span className="truncate">{secondary}</span>}
            {/* Gasto com notinha mostra o que tem dentro sem precisar abrir. */}
            {(e.items_count > 0 || e.has_receipt) && (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: colors.surface }}
              >
                {e.items_count > 0 ? t.expenseRow.itemsCount(e.items_count) : t.common.receipt}
              </span>
            )}
          </div>
        )}
      </div>
      {payment && (
        <PaymentLogo provider={payment.provider} kind={payment.kind} color={payment.color} size={22} />
      )}
      <div className="font-bold" style={{ color: colors.text }}>
        {formatBRL(e.amount)}
      </div>
    </button>
  );
}
