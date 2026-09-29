'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '../AppIcon';
import { CategoryIcon } from '../CategoryIcon';
import { DonutChart } from '../DonutChart';
import { ExpenseItems } from '../ExpenseItems';
import { useData } from '../../context/DataContext';
import { useT } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { Category, Expense } from '../../types';
import { formatBRL } from '../../utils/currency';
import { Period, relativeDayLabel } from '../../utils/date';
import {
  subcategoryBreakdown,
  subcategoryExpenses,
  totalsByCategory,
  totalForPeriod,
} from '../../utils/analytics';

type Props = {
  expenses: Expense[];
  categories: Category[];
  date: Date;
  period: Period;
};

/**
 * Por categoria: donut + legenda, e o detalhe que desce até o fim da árvore —
 * categoria › subcategoria › lançamento › itens da notinha.
 */
export function CategoryView({ expenses, categories, date, period }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const { getCategory } = useData();
  const [selected, setSelected] = useState<string | null>(null);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const legendRefs = useRef(new Map<string, HTMLButtonElement>());
  /** Gasto aberto mostrando as subcompras da notinha. */
  const [openExpense, setOpenExpense] = useState<string | null>(null);

  function toggleSub(key: string) {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectCategory(categoryId: string | null) {
    setSelected((cur) => (cur === categoryId ? null : categoryId));
    setExpandedSubs(new Set());
  }

  const totals = useMemo(
    () => totalsByCategory(expenses, categories, date, period),
    [expenses, categories, date, period]
  );
  const total = useMemo(() => totalForPeriod(expenses, date, period), [expenses, date, period]);

  const slices = totals.map((row) => ({
    value: row.total,
    color: row.category?.color ?? colors.textMuted,
    label: `${row.category?.name ?? t.common.noCategory} · ${formatBRL(row.total)}`,
  }));

  const activeIndex = selected ? totals.findIndex((row) => row.categoryId === selected) : -1;
  const activeTotal = activeIndex >= 0 ? totals[activeIndex] : null;

  // Selecionar pela pizza precisa trazer o item correspondente da legenda pra vista.
  useEffect(() => {
    if (!selected) return;
    legendRefs.current.get(selected)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const breakdown = useMemo(
    () => (selected ? subcategoryBreakdown(expenses, categories, selected, date, period) : []),
    [selected, expenses, categories, date, period]
  );

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut */}
        <div className="flex flex-col items-center justify-center rounded-3xl p-8" style={{ backgroundColor: colors.card }}>
          <DonutChart
            data={slices}
            size={240}
            thickness={32}
            trackColor={colors.surface}
            activeIndex={activeIndex >= 0 ? activeIndex : null}
            onSelect={(i) => selectCategory(totals[i].categoryId)}
          >
            <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>
              {activeTotal
                ? activeTotal.category?.name ?? t.common.noCategory
                : t.charts.total}
            </div>
            <div className="text-2xl font-extrabold" style={{ color: colors.text }}>
              {formatBRL(activeTotal ? activeTotal.total : total)}
            </div>
            {activeTotal && (
              <div className="mt-0.5 text-xs font-semibold" style={{ color: colors.textMuted }}>
                {t.web.percentOfPeriod((activeTotal.percent * 100).toFixed(0))}
              </div>
            )}
          </DonutChart>

          <p className="mt-4 text-center text-xs" style={{ color: colors.textMuted }}>
            {activeTotal
              ? t.web.clickSliceAgain
              : t.web.clickSlice}
          </p>
        </div>

        {/* Legenda / lista — altura travada pra não empurrar o gráfico pra fora da tela. */}
        <div className="max-h-104 space-y-2 overflow-y-auto p-1">
          {totals.map((row) => {
            const active = selected === row.categoryId;
            const dimmed = selected !== null && !active;
            return (
              <button
                key={row.categoryId ?? 'none'}
                ref={(el) => {
                  if (row.categoryId) {
                    if (el) legendRefs.current.set(row.categoryId, el);
                    else legendRefs.current.delete(row.categoryId);
                  }
                }}
                onClick={() => selectCategory(row.categoryId)}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:opacity-90"
                style={{
                  backgroundColor: colors.card,
                  outline: active ? `2px solid ${row.category?.color ?? colors.primary}` : 'none',
                  opacity: dimmed ? 0.5 : 1,
                }}
              >
                <CategoryIcon
                  icon={row.category?.icon ?? 'tag'}
                  color={row.category?.color ?? colors.textMuted}
                  size={40}
                />
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: colors.text }}>
                    {row.category?.name ?? t.common.noCategory}
                  </div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    {(row.percent * 100).toFixed(0)}% · {t.web.expenseCount(row.count)}
                  </div>
                </div>
                <div className="font-bold" style={{ color: colors.text }}>
                  {formatBRL(row.total)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhe por subcategoria */}
      {selected && breakdown.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold" style={{ color: colors.text }}>
              {t.web.bySubcategory(getCategory(selected)?.name ?? '')}
            </h2>
            <button
              onClick={() => selectCategory(null)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
              style={{ backgroundColor: colors.surface, color: colors.textMuted }}
            >
              {t.web.clearFilter}
            </button>
          </div>
          <div className="space-y-2">
            {breakdown.map((b) => {
              const open = expandedSubs.has(b.key);
              const parentColor = getCategory(selected)?.color ?? colors.textMuted;
              const items = open
                ? subcategoryExpenses(expenses, categories, selected, b.key, date, period)
                : [];
              return (
                <div key={b.key} className="overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
                  <button
                    onClick={() => toggleSub(b.key)}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:opacity-90"
                  >
                    <CategoryIcon
                      icon={b.sub?.icon ?? 'dots-horizontal'}
                      color={parentColor}
                      size={36}
                    />
                    <div className="min-w-0 flex-1 font-semibold" style={{ color: colors.text }}>
                      <span className="truncate">{b.sub?.name ?? t.common.noSubcategory}</span>
                      <span className="ml-2 text-xs font-medium" style={{ color: colors.textMuted }}>
                        {t.web.expenseCount(b.count)}
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>{(b.percent * 100).toFixed(0)}%</div>
                    <div className="font-bold" style={{ color: colors.text }}>{formatBRL(b.total)}</div>
                    <AppIcon
                      icon={open ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </button>
                  {open && (
                    <div className="space-y-1 px-3 pb-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                      {items.map((e) => {
                        const comItens = e.items_count > 0;
                        const itensAbertos = openExpense === e.id;
                        return (
                          <div key={e.id}>
                            {/* Gasto com notinha vira mais um nível da árvore:
                                categoria > subcategoria > gasto > itens. */}
                            <button
                              type="button"
                              disabled={!comItens}
                              onClick={() => setOpenExpense(itensAbertos ? null : e.id)}
                              className="flex w-full items-center gap-3 pt-2 text-left disabled:cursor-default"
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: parentColor }} />
                              <div className="min-w-0 flex-1 truncate text-sm" style={{ color: colors.text }}>
                                {e.note?.trim() || (b.sub?.name ?? t.common.noSubcategory)}
                              </div>
                              <div className="shrink-0 text-xs" style={{ color: colors.textMuted }}>
                                {relativeDayLabel(e.occurred_at)}
                              </div>
                              <div className="shrink-0 text-sm font-semibold" style={{ color: colors.text }}>
                                {formatBRL(e.amount)}
                              </div>
                              {comItens && (
                                <span className="shrink-0 text-xs font-bold" style={{ color: colors.textMuted }}>
                                  {e.items_count} {itensAbertos ? '▴' : '▾'}
                                </span>
                              )}
                            </button>

                            {itensAbertos && <ExpenseItems expenseId={e.id} color={parentColor} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
