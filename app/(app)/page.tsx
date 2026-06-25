'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppIcon } from '../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../src/components/CategoryIcon';
import { ExpenseModal } from '../../src/components/ExpenseModal';
import { PiggyMark } from '../../src/components/Mascot';
import { PeriodSwitcher } from '../../src/components/PeriodSwitcher';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { Expense } from '../../src/types';
import { formatBRL } from '../../src/utils/currency';
import { Period, dateHeaderLabel, shiftPeriod } from '../../src/utils/date';
import {
  evaluateBudgets,
  expensesForPeriod,
  totalForPeriod,
} from '../../src/utils/analytics';

export default function DashboardPage() {
  const { colors } = useTheme();
  const { expenses, categories, budgets, getCategory, loading } = useData();
  const { session } = useAuth();
  const [date, setDate] = useState(new Date());
  const [period, setPeriod] = useState<Period>('month');
  const [editing, setEditing] = useState<Expense | null>(null);
  const [hideValue, setHideValue] = useState(false);

  // Primeiro nome: nome do Google quando houver; senão deriva do e-mail.
  const firstName = useMemo(() => {
    const meta = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
    const fromMeta = (meta.given_name ?? meta.full_name ?? meta.name) as
      | string
      | undefined;
    const raw = fromMeta
      ? String(fromMeta).trim().split(' ')[0]
      : (session?.user.email?.split('@')[0] ?? '').split(/[._-]/)[0];
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'você';
  }, [session?.user.email, session?.user.user_metadata]);

  const avatarUrl = useMemo(() => {
    const meta = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
    return (meta.avatar_url ?? meta.picture) as string | undefined;
  }, [session?.user.user_metadata]);

  const total = useMemo(() => totalForPeriod(expenses, date, period), [expenses, date, period]);
  const list = useMemo(() => expensesForPeriod(expenses, date, period), [expenses, date, period]);
  const prevTotal = useMemo(
    () => totalForPeriod(expenses, shiftPeriod(date, period, -1), period),
    [expenses, date, period]
  );
  // Variação percentual em relação ao período anterior.
  const trend = prevTotal > 0 ? (total - prevTotal) / prevTotal : null;

  // Limites do período atual, ordenados pelo mais crítico.
  const periodBudgets = useMemo(
    () =>
      evaluateBudgets(budgets, expenses, categories, date)
        .filter((a) => a.budget.period === period)
        .sort((a, b) => b.ratio - a.ratio),
    [budgets, expenses, categories, date, period]
  );
  const alerts = periodBudgets.filter((a) => a.level === 'exceeded');

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
      {/* Saudação + período */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={44} height={44} className="rounded-full" />
          ) : (
            <PiggyMark size={40} />
          )}
          <h1 className="text-2xl font-extrabold" style={{ color: colors.text }}>
            Bora poupar, {firstName}!
          </h1>
        </div>
        <PeriodSwitcher date={date} period={period} onChangeDate={setDate} onChangePeriod={setPeriod} />
      </div>

      {/* Card total */}
      <div
        className="mb-6 rounded-3xl p-8"
        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}cc)` }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold opacity-90" style={{ color: colors.onPrimary }}>
            Total gasto {period === 'month' ? 'no mês' : 'no ano'}
          </div>
          <button
            onClick={() => setHideValue((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-90"
            style={{ backgroundColor: hexWithAlpha('#FFFFFF', 0.22) }}
            aria-label={hideValue ? 'Mostrar valor' : 'Ocultar valor'}
          >
            <AppIcon icon={hideValue ? 'eye-off' : 'eye'} size={18} color={colors.onPrimary} />
          </button>
        </div>
        <div className="mt-1 text-5xl font-extrabold" style={{ color: colors.onPrimary }}>
          {hideValue ? '•••••' : `${total > 0 ? '− ' : ''}${formatBRL(total)}`}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: hexWithAlpha('#FFFFFF', 0.18), color: colors.onPrimary }}
          >
            <AppIcon icon="receipt-text-outline" size={14} color={colors.onPrimary} />
            {list.length} {list.length === 1 ? 'lançamento' : 'lançamentos'}
          </span>
          {trend !== null && (
            <span
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: hexWithAlpha('#FFFFFF', 0.18), color: colors.onPrimary }}
            >
              <AppIcon
                icon={trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'trending-neutral'}
                size={14}
                color={colors.onPrimary}
              />
              {trend > 0 ? '+' : ''}
              {Math.round(trend * 100)}% vs {period === 'month' ? 'mês' : 'ano'} anterior
            </span>
          )}
        </div>
      </div>

      {/* Alertas de limite ultrapassado */}
      {alerts.map((a) => (
        <div
          key={a.budget.id}
          className="mb-3 flex items-center gap-3 rounded-2xl border p-4"
          style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger }}
        >
          <AppIcon icon="alert-circle" size={22} color={colors.danger} />
          <div className="flex-1">
            <div className="font-bold" style={{ color: colors.text }}>
              Limite ultrapassado{a.category ? ` · ${a.category.name}` : ' · Geral'}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {formatBRL(a.spent)} de {formatBRL(a.budget.limit_amount)} ({Math.round(a.ratio * 100)}%)
            </div>
          </div>
        </div>
      ))}

      {/* Limite de gastos */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: colors.text }}>Limite de gastos</h2>
          <Link href="/limites" className="text-sm font-bold" style={{ color: colors.primary }}>
            Gerenciar
          </Link>
        </div>

        {periodBudgets.length === 0 ? (
          <Link
            href="/limites"
            className="flex items-center gap-3 rounded-2xl border p-4 transition hover:opacity-90"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: hexWithAlpha(colors.warning, 0.16) }}
            >
              <AppIcon icon="bell-plus" size={22} color={colors.warning} />
            </span>
            <span className="flex-1">
              <span className="block font-bold" style={{ color: colors.text }}>Defina um limite</span>
              <span className="block text-sm" style={{ color: colors.textMuted }}>
                Receba alertas ao se aproximar do teto de gastos.
              </span>
            </span>
            <AppIcon icon="chevron-right" size={22} color={colors.textMuted} />
          </Link>
        ) : (
          <div className="space-y-4 rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
            {periodBudgets.map((b) => {
              const barColor =
                b.level === 'exceeded'
                  ? colors.danger
                  : b.level === 'warning'
                    ? colors.warning
                    : colors.success;
              return (
                <div key={b.budget.id} className="flex items-center gap-3">
                  {b.category ? (
                    <CategoryIcon icon={b.category.icon} color={b.category.color} size={38} />
                  ) : (
                    <span
                      className="flex h-[38px] w-[38px] items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primarySoft }}
                    >
                      <AppIcon icon="earth" size={20} color={colors.primary} />
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold" style={{ color: colors.text }}>
                        {b.category?.name ?? 'Limite geral'}
                      </span>
                      <span className="shrink-0 font-bold" style={{ color: colors.text }}>
                        {formatBRL(b.spent)} / {formatBRL(b.budget.limit_amount)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.surface }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(Math.max(b.ratio * 100, 3), 100)}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <div className="mt-1 text-xs font-semibold" style={{ color: barColor }}>
                      {b.spent >= b.budget.limit_amount
                        ? `Ultrapassou ${formatBRL(b.spent - b.budget.limit_amount)}`
                        : `Faltam ${formatBRL(b.budget.limit_amount - b.spent)} para o limite`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lançamentos */}
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
