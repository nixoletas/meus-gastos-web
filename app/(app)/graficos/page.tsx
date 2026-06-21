'use client';

import { useMemo, useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { DonutChart } from '../../../src/components/DonutChart';
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
  }));

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
            <DonutChart data={slices} size={240} thickness={32} trackColor={colors.surface}>
              <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>Total</div>
              <div className="text-2xl font-extrabold" style={{ color: colors.text }}>{formatBRL(total)}</div>
            </DonutChart>
          </div>

          {/* Legenda / lista */}
          <div className="space-y-2">
            {totals.map((t) => {
              const active = selected === t.categoryId;
              return (
                <button
                  key={t.categoryId ?? 'none'}
                  onClick={() => selectCategory(t.categoryId)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:opacity-90"
                  style={{ backgroundColor: colors.card, outline: active ? `2px solid ${t.category?.color ?? colors.primary}` : 'none' }}
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
          <h2 className="mb-3 text-lg font-bold" style={{ color: colors.text }}>
            {getCategory(selected)?.name} · por subcategoria
          </h2>
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
                      {items.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 pt-2">
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
                        </div>
                      ))}
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
