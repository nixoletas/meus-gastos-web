'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { PaymentLogo } from '../../../src/components/PaymentLogo';
import { PaymentMethodModal } from '../../../src/components/PaymentMethodModal';
import { useData } from '../../../src/context/DataContext';
import { useLedger } from '../../../src/context/LedgerContext';
import { KIND_ICONS } from '../../../src/data/paymentProviders';
import { useT } from '../../../src/i18n';
import { useTheme } from '../../../src/theme/ThemeContext';
import { PaymentMethod } from '../../../src/types';
import { formatBRL } from '../../../src/utils/currency';
import { paymentLabel } from '../../../src/utils/payment';

/** Meios de pagamento do caderno, com quanto já passou por cada um. */
export default function PagamentosPage() {
  const { colors } = useTheme();
  const t = useT();
  const { canWrite } = useLedger();
  const { paymentMethods, expenses } = useData();
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [creating, setCreating] = useState(false);

  // Total de todos os tempos por meio — ajuda a reconhecer qual é qual.
  const usage = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      if (!e.payment_method_id) continue;
      const u = map.get(e.payment_method_id) ?? { total: 0, count: 0 };
      u.total += e.amount;
      u.count += 1;
      map.set(e.payment_method_id, u);
    }
    return map;
  }, [expenses]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/mais"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-70"
          style={{ backgroundColor: colors.surface }}
          aria-label={t.common.back}
        >
          <AppIcon icon="chevron-left" size={22} color={colors.text} />
        </Link>
        <h1 className="flex-1 text-2xl font-extrabold" style={{ color: colors.text }}>
          {t.payment.manageTitle}
        </h1>
        {canWrite && paymentMethods.length > 0 && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            <AppIcon icon="plus" size={18} color={colors.onPrimary} />
            {t.payment.add}
          </button>
        )}
      </div>

      {paymentMethods.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-2xl px-6 py-14 text-center"
          style={{ backgroundColor: colors.card }}
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ backgroundColor: colors.primarySoft }}
          >
            <AppIcon icon="credit-card-multiple" size={40} color={colors.primary} />
          </div>
          <p className="max-w-sm" style={{ color: colors.textMuted }}>
            {t.payment.empty}
          </p>
          {canWrite && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded-xl px-5 py-3 font-bold transition hover:opacity-90"
              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >
              <AppIcon icon="plus" size={18} color={colors.onPrimary} />
              {t.payment.addFirst}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
          {paymentMethods.map((pm, i) => {
            const u = usage.get(pm.id);
            return (
              <button
                key={pm.id}
                onClick={() => setEditing(pm)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:opacity-80"
                style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : undefined }}
              >
                <PaymentLogo provider={pm.provider} kind={pm.kind} color={pm.color} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold" style={{ color: colors.text }}>
                    {paymentLabel(pm, t)}
                  </div>
                  <div className="flex items-center gap-1 text-sm" style={{ color: colors.textMuted }}>
                    <AppIcon icon={KIND_ICONS[pm.kind]} size={13} color={colors.textMuted} />
                    <span className="truncate">
                      {t.payment.kinds[pm.kind]}
                      {u ? ` · ${t.home.entriesCount(u.count)} · ${formatBRL(u.total)}` : ''}
                    </span>
                  </div>
                </div>
                <AppIcon icon="chevron-right" size={20} color={colors.textMuted} />
              </button>
            );
          })}
        </div>
      )}

      <PaymentMethodModal
        open={creating || !!editing}
        method={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
