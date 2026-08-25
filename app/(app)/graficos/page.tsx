'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { DonutChart } from '../../../src/components/DonutChart';
import { ExpenseItems } from '../../../src/components/ExpenseItems';
import { PeriodSwitcher } from '../../../src/components/PeriodSwitcher';
import { useData } from '../../../src/context/DataContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { formatBRL } from '../../../src/utils/currency';
import { Period, relativeDayLabel } from '../../../src/utils/date';
import {
  subcategoryBreakdown,
  subcategoryExpenses,
  totalsByCategory,
  totalForPeriod,
} from '../../../src/utils/analytics';

export default function GraficosPage() {
  const { colors } = useTheme();
  const { expenses, categories, getCategory } = useData();
  const [date, setDate] = useState(new Date());
  const [period, setPeriod] = useState<Period>('month');
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

  const slices = totals.map((t) => ({
    value: t.total,
    color: t.category?.color ?? colors.textMuted,
    label: `${t.category?.name ?? 'Sem categoria'} · ${formatBRL(t.total)}`,
  }));

  const activeIndex = selected ? totals.findIndex((t) => t.categoryId === selected) : -1;
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold" style={{ color: colors.text }}>Gráficos</h1>
        <PeriodSwitcher date={date} period={period} onChangeDate={setDate} onChangePeriod={setPeriod} />
      </div>

      {totals.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ backgroundColor: colors.card, color: colors.textMuted }}>
          Sem dados para o período.
        </div>
      ) : (
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
                {activeTotal ? activeTotal.category?.name ?? 'Sem categoria' : 'Total'}
              </div>
              <div className="text-2xl font-extrabold" style={{ color: colors.text }}>
                {formatBRL(activeTotal ? activeTotal.total : total)}
              </div>
              {activeTotal && (
                <div className="mt-0.5 text-xs font-semibold" style={{ color: colors.textMuted }}>
                  {(activeTotal.percent * 100).toFixed(0)}% do período
                </div>
              )}
            </DonutChart>

            <p className="mt-4 text-center text-xs" style={{ color: colors.textMuted }}>
              {activeTotal
                ? 'Clique de novo na fatia para ver tudo.'
                : 'Clique em uma fatia para filtrar a categoria.'}
            </p>
          </div>

          {/* Legenda / lista — altura travada pra não empurrar o gráfico pra fora da tela. */}
          <div className="max-h-104 space-y-2 overflow-y-auto p-1">
            {totals.map((t) => {
              const active = selected === t.categoryId;
              const dimmed = selected !== null && !active;
              return (
                <button
                  key={t.categoryId ?? 'none'}
                  ref={(el) => {
                    if (t.categoryId) {
                      if (el) legendRefs.current.set(t.categoryId, el);
                      else legendRefs.current.delete(t.categoryId);
                    }
                  }}
                  onClick={() => selectCategory(t.categoryId)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:opacity-90"
                  style={{
                    backgroundColor: colors.card,
                    outline: active ? `2px solid ${t.category?.color ?? colors.primary}` : 'none',
                    opacity: dimmed ? 0.5 : 1,
                  }}
                >
                  <CategoryIcon icon={t.category?.icon ?? 'tag'} color={t.category?.color ?? colors.textMuted} size={40} />
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: colors.text }}>
                      {t.category?.name ?? 'Sem categoria'}
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      {(t.percent * 100).toFixed(0)}% · {t.count} {t.count === 1 ? 'gasto' : 'gastos'}
                    </div>
                  </div>
                  <div className="font-bold" style={{ color: colors.text }}>{formatBRL(t.total)}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalhe por subcategoria */}
      {selected && breakdown.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold" style={{ color: colors.text }}>
              {getCategory(selected)?.name} · por subcategoria
            </h2>
            <button
              onClick={() => selectCategory(null)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
              style={{ backgroundColor: colors.surface, color: colors.textMuted }}
            >
              ✕ Limpar filtro
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
                      <span className="truncate">{b.sub?.name ?? 'Sem subcategoria'}</span>
                      <span className="ml-2 text-xs font-medium" style={{ color: colors.textMuted }}>
                        {b.count} {b.count === 1 ? 'gasto' : 'gastos'}
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
                                {e.note?.trim() || (b.sub?.name ?? 'Sem subcategoria')}
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
