'use client';

import { useMemo, useState } from 'react';
import { AppIcon } from '../../src/components/AppIcon';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { ExpenseModal } from '../../src/components/ExpenseModal';
import { PeriodSwitcher } from '../../src/components/PeriodSwitcher';
import { useData } from '../../src/context/DataContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { Expense } from '../../src/types';
import { formatBRL } from '../../src/utils/currency';
import { Period, dateHeaderLabel } from '../../src/utils/date';
import { expensesForPeriod, totalForPeriod } from '../../src/utils/analytics';

export default function DashboardPage() {
  const { colors } = useTheme();
  const { expenses, getCategory, loading } = useData();
  const [date, setDate] = useState(new Date());
  const [period, setPeriod] = useState<Period>('month');
  const [editing, setEditing] = useState<Expense | null>(null);

  const total = useMemo(() => totalForPeriod(expenses, date, period), [expenses, date, period]);
  const list = useMemo(() => expensesForPeriod(expenses, date, period), [expenses, date, period]);

  // Agrupa por dia (occurred_at).
  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of list) {
      const key = e.occurred_at.split('T')[0];
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [list]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold" style={{ color: colors.text }}>Início</h1>
        <PeriodSwitcher date={date} period={period} onChangeDate={setDate} onChangePeriod={setPeriod} />
      </div>

      {/* Card total */}
      <div
        className="mb-8 rounded-3xl p-8"
        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}cc)` }}
      >
        <div className="text-sm font-semibold opacity-90" style={{ color: colors.onPrimary }}>
          Total gasto no período
        </div>
        <div className="mt-1 text-5xl font-extrabold" style={{ color: colors.onPrimary }}>
          {formatBRL(total)}
        </div>
        <div className="mt-2 text-sm opacity-90" style={{ color: colors.onPrimary }}>
          {list.length} {list.length === 1 ? 'lançamento' : 'lançamentos'}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <Empty colors={colors} icon="loading" text="Carregando…" />
      ) : groups.length === 0 ? (
        <Empty colors={colors} icon="emoticon-happy-outline" text="Nenhum gasto no período. Que economia!" />
      ) : (
        <div className="space-y-6">
          {groups.map(([day, items]) => (
            <div key={day}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
                  {dateHeaderLabel(day)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
                  {formatBRL(items.reduce((s, e) => s + e.amount, 0))}
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
                {items.map((e, i) => {
                  const cat = getCategory(e.subcategory_id) ?? getCategory(e.category_id);
                  const parent = cat?.parent_id ? getCategory(cat.parent_id) : cat;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setEditing(e)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:opacity-80"
                      style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : undefined }}
                    >
                      <CategoryIcon icon={cat?.icon ?? 'tag'} color={parent?.color ?? colors.textMuted} size={42} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold" style={{ color: colors.text }}>
                          {cat?.name ?? 'Sem categoria'}
                        </div>
                        {e.note && (
                          <div className="truncate text-sm" style={{ color: colors.textMuted }}>{e.note}</div>
                        )}
                      </div>
                      <div className="font-bold" style={{ color: colors.text }}>{formatBRL(e.amount)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ExpenseModal open={!!editing} onClose={() => setEditing(null)} expense={editing} />
    </div>
  );
}

function Empty({ colors, icon, text }: { colors: any; icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl py-20 text-center" style={{ backgroundColor: colors.card }}>
      <AppIcon icon={icon} size={48} color={colors.textMuted} />
      <p className="font-semibold" style={{ color: colors.textMuted }}>{text}</p>
    </div>
  );
}
