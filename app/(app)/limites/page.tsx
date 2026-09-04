'use client';

import { useMemo, useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { useData } from '../../../src/context/DataContext';
import { useLedger } from '../../../src/context/LedgerContext';
import { useT } from '../../../src/i18n';
import { useTheme } from '../../../src/theme/ThemeContext';
import { formatBRL, maskCurrencyInput, rawToReais } from '../../../src/utils/currency';
import { Period } from '../../../src/utils/date';
import { evaluateBudgets } from '../../../src/utils/analytics';

export default function LimitesPage() {
  const { colors } = useTheme();
  const t = useT();
  const { budgets, expenses, categories, categoriesWithSubs, setBudget, deleteBudget } = useData();
  const { canWrite } = useLedger();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [raw, setRaw] = useState('');
  const [saving, setSaving] = useState(false);

  const alerts = useMemo(
    () => evaluateBudgets(budgets, expenses, categories, new Date()).sort((a, b) => b.ratio - a.ratio),
    [budgets, expenses, categories]
  );

  const amount = rawToReais(raw);

  async function handleAdd() {
    if (amount <= 0) return;
    setSaving(true);
    await setBudget({ category_id: categoryId, period, limit_amount: amount });
    setRaw('');
    setSaving(false);
  }

  function levelColor(level: string) {
    if (level === 'exceeded') return colors.danger;
    if (level === 'warning') return colors.warning;
    return colors.success;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold" style={{ color: colors.text }}>
        {t.web.limitsTitle}
      </h1>

      {/* Form novo limite — quem só visualiza não define teto de gasto. */}
      {canWrite && (
      <div className="mb-8 rounded-2xl p-5" style={{ backgroundColor: colors.card }}>
        <div className="mb-4 font-bold" style={{ color: colors.text }}>
          {t.web.setLimit}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <Label colors={colors}>{t.web.category}</Label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
            >
              <option value="">{t.web.generalOption}</option>
              {categoriesWithSubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label colors={colors}>{t.web.period}</Label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
            >
              <option value="month">{t.limits.monthly}</option>
              <option value="year">{t.limits.yearly}</option>
            </select>
          </div>
          <div>
            <Label colors={colors}>{t.web.amount}</Label>
            <div className="flex items-center gap-1 rounded-xl border px-3 py-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <span className="text-sm font-bold" style={{ color: colors.textMuted }}>R$</span>
              <input
                inputMode="numeric"
                value={maskCurrencyInput(raw)}
                onChange={(e) => setRaw(e.target.value)}
                className="w-28 bg-transparent text-right font-bold outline-none"
                style={{ color: colors.text }}
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={amount <= 0 || saving}
            className="rounded-xl px-5 py-2.5 font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            {saving ? '…' : t.common.save}
          </button>
        </div>
      </div>
      )}

      {/* Lista de limites */}
      {alerts.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ backgroundColor: colors.card, color: colors.textMuted }}>
          {t.web.noLimitsYet}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const c = levelColor(a.level);
            const pct = Math.min(a.ratio, 1) * 100;
            return (
              <div key={a.budget.id} className="rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
                <div className="flex items-center gap-3">
                  <CategoryIcon
                    icon={a.category?.icon ?? 'cash-multiple'}
                    color={a.category?.color ?? colors.primary}
                    size={42}
                  />
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: colors.text }}>
                      {a.category?.name ?? t.common.generalLimit}
                      <span className="ml-2 text-xs font-semibold" style={{ color: colors.textMuted }}>
                        {a.budget.period === 'year' ? t.web.yearlyLower : t.web.monthlyLower}
                      </span>
                    </div>
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      {t.web.spentOf(formatBRL(a.spent), formatBRL(a.budget.limit_amount))}
                    </div>
                  </div>
                  {canWrite && (
                  <button
                    onClick={() => deleteBudget(a.budget.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
                    style={{ backgroundColor: colors.surface }}
                    aria-label={t.common.remove}
                  >
                    <AppIcon icon="trash-can-outline" size={16} color={colors.danger} />
                  </button>
                  )}
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.surface }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c }} />
                </div>
                {a.level === 'exceeded' && (
                  <div className="mt-2 text-sm font-semibold" style={{ color: colors.danger }}>
                    {t.web.exceededBy(formatBRL(a.spent - a.budget.limit_amount))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Label({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
      {children}
    </div>
  );
}
