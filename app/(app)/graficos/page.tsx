'use client';

import { useMemo, useState } from 'react';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { DonutChart } from '../../../src/components/DonutChart';
import { PeriodSwitcher } from '../../../src/components/PeriodSwitcher';
import { useData } from '../../../src/context/DataContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { formatBRL } from '../../../src/utils/currency';
import { Period } from '../../../src/utils/date';
import { subcategoryBreakdown, totalsByCategory, totalForPeriod } from '../../../src/utils/analytics';

export default function GraficosPage() {
  const { colors } = useTheme();
  const { expenses, categories, getCategory } = useData();
  const [date, setDate] = useState(new Date());
  const [period, setPeriod] = useState<Period>('month');
  const [selected, setSelected] = useState<string | null>(null);

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
                  onClick={() => setSelected(active ? null : t.categoryId)}
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
            {breakdown.map((b) => (
              <div key={b.key} className="flex items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: colors.card }}>
                <CategoryIcon
                  icon={b.sub?.icon ?? 'dots-horizontal'}
                  color={getCategory(selected)?.color ?? colors.textMuted}
                  size={36}
                />
                <div className="flex-1 font-semibold" style={{ color: colors.text }}>
                  {b.sub?.name ?? 'Sem subcategoria'}
                </div>
                <div className="text-sm" style={{ color: colors.textMuted }}>{(b.percent * 100).toFixed(0)}%</div>
                <div className="font-bold" style={{ color: colors.text }}>{formatBRL(b.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
