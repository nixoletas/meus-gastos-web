'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLedger } from '../../context/LedgerContext';
import { useT } from '../../i18n';
import { categoryPalette } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { NO_PAYMENT_KEY, totalsByPaymentMethod } from '../../utils/analytics';
import { formatBRL } from '../../utils/currency';
import { Period } from '../../utils/date';
import { paymentLabel } from '../../utils/payment';
import { AppIcon } from '../AppIcon';
import { DonutChart } from '../DonutChart';
import { PaymentLogo } from '../PaymentLogo';
import { ExpenseList } from './ExpenseList';
import { RankRow } from './RankRow';

type Props = {
  expenses: Expense[];
  date: Date;
  period: Period;
  onOpen: (expense: Expense) => void;
};

/** Por meio de pagamento: donut + ranking com os logos, "Não informado" no fim. */
export function PaymentView({ expenses, date, period, onOpen }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const { canWrite } = useLedger();
  const { getPaymentMethod, paymentMethods } = useData();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [date, period]);

  const groups = useMemo(() => totalsByPaymentMethod(expenses, date, period), [expenses, date, period]);

  // Dois meios do mesmo banco (Nubank crédito e Nubank pix) teriam a mesma cor
  // no donut; o segundo pega uma cor livre da paleta.
  const colorOf = useMemo(() => {
    const used = new Set<string>();
    const map = new Map<string, string>();
    let spare = 0;
    for (const g of groups) {
      if (g.key === NO_PAYMENT_KEY) {
        map.set(g.key, colors.textMuted);
        continue;
      }
      let c = getPaymentMethod(g.key)?.color ?? colors.textMuted;
      if (used.has(c.toLowerCase())) {
        while (spare < categoryPalette.length && used.has(categoryPalette[spare].toLowerCase())) spare += 1;
        c = categoryPalette[spare % categoryPalette.length];
        spare += 1;
      }
      used.add(c.toLowerCase());
      map.set(g.key, c);
    }
    return map;
  }, [groups, getPaymentMethod, colors.textMuted]);

  const known = groups.filter((g) => g.key !== NO_PAYMENT_KEY);
  const unknown = groups.find((g) => g.key === NO_PAYMENT_KEY);
  const total = groups.reduce((s, g) => s + g.total, 0);
  const activeIndex = selected ? groups.findIndex((g) => g.key === selected) : -1;
  const focus = activeIndex >= 0 ? groups[activeIndex] : null;
  const focusMethod = focus ? getPaymentMethod(focus.key) : undefined;

  if (known.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-2xl px-6 py-14 text-center"
        style={{ backgroundColor: colors.card }}
      >
        <AppIcon icon="credit-card-multiple" size={44} color={colors.primary} />
        <p className="max-w-sm" style={{ color: colors.textMuted }}>
          {t.views.paymentEmpty}
        </p>
        {canWrite && paymentMethods.length === 0 && (
          <Link
            href="/pagamentos"
            className="rounded-xl px-5 py-2.5 font-bold transition hover:opacity-90"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            {t.payment.addFirst}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center rounded-3xl p-8" style={{ backgroundColor: colors.card }}>
        <DonutChart
          data={groups.map((g) => {
            const pm = getPaymentMethod(g.key);
            return {
              value: g.total,
              color: colorOf.get(g.key)!,
              label: `${pm ? paymentLabel(pm, t) : t.payment.none} · ${formatBRL(g.total)}`,
            };
          })}
          size={240}
          thickness={32}
          trackColor={colors.surface}
          activeIndex={activeIndex >= 0 ? activeIndex : null}
          onSelect={(i) => setSelected((cur) => (cur === groups[i].key ? null : groups[i].key))}
        >
          {focus ? (
            <>
              {focusMethod && (
                <PaymentLogo
                  provider={focusMethod.provider}
                  kind={focusMethod.kind}
                  color={focusMethod.color}
                  size={30}
                />
              )}
              <div className="text-2xl font-extrabold" style={{ color: colors.text }}>
                {formatBRL(focus.total)}
              </div>
              <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>
                {t.charts.percentOfTotal(Math.round(focus.percent * 100))}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>
                {t.charts.total}
              </div>
              <div className="text-2xl font-extrabold" style={{ color: colors.text }}>
                {formatBRL(total)}
              </div>
            </>
          )}
        </DonutChart>
        {unknown && (
          <p className="mt-4 flex items-center gap-1.5 text-center text-xs" style={{ color: colors.textMuted }}>
            <AppIcon icon="information-outline" size={14} color={colors.textMuted} />
            {t.views.unknownShare(Math.round(unknown.percent * 100))}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {groups.map((g) => {
          const pm = g.key === NO_PAYMENT_KEY ? undefined : getPaymentMethod(g.key);
          const open = selected === g.key;
          return (
            <RankRow
              key={g.key}
              icon={
                <PaymentLogo
                  provider={pm?.provider}
                  kind={pm?.kind ?? 'outro'}
                  color={pm ? pm.color : colors.textMuted}
                  size={40}
                />
              }
              title={pm ? paymentLabel(pm, t) : t.payment.none}
              subtitle={t.home.entriesCount(g.count)}
              total={g.total}
              percent={g.percent}
              color={colorOf.get(g.key)!}
              expanded={open}
              dimmed={selected !== null && !open}
              onClick={() => setSelected(open ? null : g.key)}
            >
              <ExpenseList expenses={g.expenses} onOpen={onOpen} />
            </RankRow>
          );
        })}
      </div>
    </div>
  );
}
