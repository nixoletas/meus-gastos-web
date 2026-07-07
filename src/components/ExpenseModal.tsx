'use client';

import { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../theme/ThemeContext';
import { Expense } from '../types';
import { maskCurrencyInput, rawToReais, reaisToRaw } from '../utils/currency';
import { fromISODate, relativeDayLabel, toISODate } from '../utils/date';
import { AppIcon } from './AppIcon';
import { Calendar } from './Calendar';
import { hexWithAlpha } from './CategoryIcon';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
};

export function ExpenseModal({ open, onClose, expense }: Props) {
  const { colors } = useTheme();
  const { categoriesWithSubs, addExpense, updateExpense, deleteExpense } = useData();

  const [raw, setRaw] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Preenche ao abrir (novo ou edição).
  useEffect(() => {
    if (!open) return;
    setShowCalendar(false);
    if (expense) {
      setRaw(reaisToRaw(expense.amount));
      setCategoryId(expense.category_id);
      setSubId(expense.subcategory_id);
      setDate(expense.occurred_at.split('T')[0]);
      setNote(expense.note ?? '');
    } else {
      setRaw('');
      setCategoryId(null);
      setSubId(null);
      setDate(toISODate(new Date()));
      setNote('');
    }
  }, [open, expense]);

  const amount = rawToReais(raw);
  const selectedParent = categoriesWithSubs.find((c) => c.id === categoryId);
  const canSave = amount > 0 && categoryId;

  const quickDates = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    return [
      { label: 'Hoje', value: toISODate(today) },
      { label: 'Ontem', value: toISODate(yesterday) },
    ];
  }, []);
  const isQuickDate = quickDates.some((q) => q.value === date);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const payload = {
      amount,
      note: note.trim() || null,
      category_id: categoryId,
      subcategory_id: subId,
      occurred_at: date,
    };
    if (expense) await updateExpense(expense.id, payload);
    else await addExpense(payload);
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!expense) return;
    if (!confirm('Excluir este gasto?')) return;
    await deleteExpense(expense.id);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Editar gasto' : 'Novo gasto'} maxWidth={560}>
      {/* Valor */}
      <div className="mb-5 text-center">
        <div
          className="inline-flex items-baseline gap-1 rounded-2xl px-6 py-4"
          style={{ backgroundColor: colors.surface }}
        >
          <span className="text-2xl font-bold" style={{ color: colors.textMuted }}>R$</span>
          <input
            autoFocus
            inputMode="numeric"
            value={maskCurrencyInput(raw)}
            onChange={(e) => setRaw(e.target.value)}
            className="w-44 bg-transparent text-right text-4xl font-extrabold outline-none"
            style={{ color: colors.text }}
          />
        </div>
      </div>

      {/* Categoria */}
      <Label>Categoria</Label>
      <div className="mb-4 flex flex-wrap gap-2">
        {categoriesWithSubs.map((cat) => {
          const active = cat.id === categoryId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(cat.id);
                setSubId(null);
              }}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition"
              style={{
                backgroundColor: active ? hexWithAlpha(cat.color, 0.16) : colors.surface,
                borderColor: active ? cat.color : colors.border,
                color: active ? colors.text : colors.textMuted,
              }}
            >
              <AppIcon icon={cat.icon} size={16} color={cat.color} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Subcategoria */}
      {selectedParent && selectedParent.subcategories.length > 0 && (
        <>
          <Label>Subcategoria (opcional)</Label>
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedParent.subcategories.map((sub) => {
              const active = sub.id === subId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubId(active ? null : sub.id)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition"
                  style={{
                    backgroundColor: active ? hexWithAlpha(selectedParent.color, 0.16) : colors.surface,
                    borderColor: active ? selectedParent.color : 'transparent',
                    color: active ? colors.text : colors.textMuted,
                  }}
                >
                  <AppIcon icon={sub.icon} size={14} color={selectedParent.color} />
                  {sub.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Data */}
      <Label>Quando</Label>
      <div className="mb-3 flex flex-wrap gap-2">
        {quickDates.map((q) => {
          const active = q.value === date;
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setDate(q.value);
                setShowCalendar(false);
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition"
              style={{
                backgroundColor: active ? colors.primary : colors.surface,
                color: active ? colors.onPrimary : colors.textMuted,
              }}
            >
              {q.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowCalendar((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          style={{
            backgroundColor: showCalendar ? colors.primarySoft : colors.surface,
            color: colors.text,
          }}
        >
          <AppIcon icon="calendar-month" size={16} color={colors.primary} />
          {isQuickDate ? 'Outra data' : relativeDayLabel(date)}
        </button>
      </div>

      {showCalendar && (
        <div className="mb-4">
          <Calendar
            selected={fromISODate(date)}
            onSelect={(d) => {
              setDate(toISODate(d));
              setShowCalendar(false);
            }}
          />
        </div>
      )}

      {/* Nota */}
      <Label>Nota (opcional)</Label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="ex.: almoço com a equipe"
        className="mb-4 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
      />

      <div className="mt-6 flex items-center gap-3">
        {expense && (
          <button
            onClick={handleDelete}
            className="rounded-xl px-4 py-3 text-sm font-bold transition hover:opacity-80"
            style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
          >
            Excluir
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="ml-auto rounded-xl px-6 py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          {saving ? 'Salvando…' : expense ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </Modal>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
      {children}
    </div>
  );
}
