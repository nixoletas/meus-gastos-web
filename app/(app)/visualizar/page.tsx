'use client';

import { useMemo, useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { ExpenseModal } from '../../../src/components/ExpenseModal';
import { PeriodSwitcher } from '../../../src/components/PeriodSwitcher';
import { CategoryView } from '../../../src/components/views/CategoryView';
import { ListView } from '../../../src/components/views/ListView';
import { PaymentView } from '../../../src/components/views/PaymentView';
import { PlacesView } from '../../../src/components/views/PlacesView';
import { Stat, TimelineView } from '../../../src/components/views/TimelineView';
import { WeekdayView } from '../../../src/components/views/WeekdayView';
import { useData } from '../../../src/context/DataContext';
import { useT } from '../../../src/i18n';
import { useTheme } from '../../../src/theme/ThemeContext';
import { Expense } from '../../../src/types';
import { elapsedDays, expensesForPeriod } from '../../../src/utils/analytics';
import { formatBRL } from '../../../src/utils/currency';
import { Period } from '../../../src/utils/date';

type Mode = 'categories' | 'timeline' | 'payment' | 'places' | 'weekday' | 'list';

const MODES: { key: Mode; icon: string }[] = [
  { key: 'categories', icon: 'chart-donut' },
  { key: 'timeline', icon: 'chart-bar' },
  { key: 'payment', icon: 'credit-card-outline' },
  { key: 'places', icon: 'map-marker-outline' },
  { key: 'weekday', icon: 'calendar-week' },
  { key: 'list', icon: 'format-list-bulleted' },
];

/**
 * Visualizar gastos: o mesmo período por vários ângulos — categoria, tempo,
 * meio de pagamento, lugar, dia da semana ou a lista crua.
 */
export default function VisualizarPage() {
  const { colors } = useTheme();
  const t = useT();
  const { expenses, categories } = useData();
  const [date, setDate] = useState(new Date());
  const [period, setPeriod] = useState<Period>('month');
  const [mode, setMode] = useState<Mode>('categories');
  const [editing, setEditing] = useState<Expense | null>(null);

  const inPeriod = useMemo(() => expensesForPeriod(expenses, date, period), [expenses, date, period]);
  const total = inPeriod.reduce((s, e) => s + e.amount, 0);
  const days = elapsedDays(date, period);
  // Média mensal do ano: só os meses que já começaram contam.
  const now = new Date();
  const months = date.getFullYear() === now.getFullYear() ? now.getMonth() + 1 : 12;

  const props = { expenses, date, period, onOpen: setEditing };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold" style={{ color: colors.text }}>
          {t.views.title}
        </h1>
        <PeriodSwitcher date={date} period={period} onChangeDate={setDate} onChangePeriod={setPeriod} />
      </div>

      {/* Modos de visualização */}
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition hover:opacity-90"
              style={{
                backgroundColor: active ? colors.primary : colors.card,
                color: active ? colors.onPrimary : colors.text,
              }}
              aria-pressed={active}
            >
              <AppIcon icon={m.icon} size={17} color={active ? colors.onPrimary : colors.textMuted} />
              {t.views.modes[m.key]}
            </button>
          );
        })}
      </div>

      {inPeriod.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ backgroundColor: colors.card, color: colors.textMuted }}>
          {t.web.noDataForPeriod}
        </div>
      ) : (
        <>
          {/* Resumo do período, igual em todos os modos */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t.views.total} value={formatBRL(total)} />
            <Stat label={t.views.entries} value={String(inPeriod.length)} />
            <Stat
              label={period === 'year' ? t.views.monthlyAvg : t.views.dailyAvg}
              value={formatBRL(period === 'year' ? total / months : total / days)}
            />
            <Stat label={t.views.ticket} value={formatBRL(total / inPeriod.length)} />
          </div>

          {mode === 'categories' && (
            <CategoryView expenses={expenses} categories={categories} date={date} period={period} />
          )}
          {mode === 'timeline' && <TimelineView {...props} />}
          {mode === 'payment' && <PaymentView {...props} />}
          {mode === 'places' && <PlacesView {...props} />}
          {mode === 'weekday' && <WeekdayView {...props} />}
          {mode === 'list' && <ListView {...props} />}
        </>
      )}

      <ExpenseModal open={!!editing} onClose={() => setEditing(null)} expense={editing} />
    </div>
  );
}
