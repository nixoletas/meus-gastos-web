'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { ParseResult } from '../lib/receipts';
import { useReceipt } from '../lib/useReceipt';
import { useTheme } from '../theme/ThemeContext';
import { Expense } from '../types';
import { formatBRL, maskCurrencyInput, rawToReais, reaisToRaw } from '../utils/currency';
import { fromISODate, relativeDayLabel, toISODate } from '../utils/date';
import { AppIcon } from './AppIcon';
import { Calendar } from './Calendar';
import { hexWithAlpha } from './CategoryIcon';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { ReceiptFields } from './ReceiptFields';
import { SuccessFlash } from './SuccessFlash';

type Props = {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
};

const LAST_DATE_KEY = 'mg:ultima-data-gasto';

/**
 * Última data usada em um novo gasto. Fica na sessão do navegador para quem
 * está lançando um mês inteiro de uma vez não precisar reabrir o calendário
 * a cada gasto — e some ao fechar a aba, evitando lançar em data antiga sem querer.
 */
function readRememberedDate(): string | null {
  if (typeof window === 'undefined') return null;
  const value = window.sessionStorage.getItem(LAST_DATE_KEY);
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function rememberDate(iso: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(LAST_DATE_KEY, iso);
}

export function ExpenseModal({ open, onClose, expense }: Props) {
  const { colors } = useTheme();
  const { categoriesWithSubs, addExpense, saveExpenseWithItems, updateExpense, deleteExpense } =
    useData();

  const [raw, setRaw] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** `id` novo a cada lançamento força a animação a rodar de novo. */
  const [flash, setFlash] = useState<{ id: number; label: string } | null>(null);
  /** Data escolhida à mão não pode ser trocada pela data lida da notinha. */
  const [dateTouched, setDateTouched] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const inlineCalendarRef = useRef<HTMLDivElement>(null);

  // Notinha: foto, leitura por OCR e as subcompras que saem dela.
  const receiptState = useReceipt({
    expenseId: expense?.id ?? null,
    active: open,
    onParsed: (result: ParseResult) => {
      // Só preenche o que está vazio: o que a pessoa digitou vale mais que o OCR.
      const total = Number(result.receipt.total ?? result.itemsTotal) || 0;
      if (total > 0) setRaw((current) => (current ? current : reaisToRaw(total)));

      const issued = result.receipt.issued_at ? new Date(result.receipt.issued_at) : null;
      if (!dateTouched && issued && !Number.isNaN(issued.getTime()) && issued <= new Date()) {
        setDate(toISODate(issued));
      }
    },
  });

  // No mobile o calendário abre embaixo: traz ele pra vista sem o usuário rolar.
  useEffect(() => {
    if (!showCalendar) return;
    inlineCalendarRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [showCalendar]);

  // Preenche ao abrir (novo ou edição).
  useEffect(() => {
    if (!open) return;
    setShowCalendar(false);
    setConfirmDelete(false);
    setDateTouched(false);
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
      setDate(readRememberedDate() ?? toISODate(new Date()));
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

  /** `keepOpen` mantém o modal aberto com data e categoria, para lançar vários seguidos. */
  async function handleSave({ keepOpen = false } = {}) {
    if (!canSave) return;
    setSaving(true);
    const payload = {
      amount,
      note: note.trim() || null,
      category_id: categoryId,
      subcategory_id: subId,
      occurred_at: date,
    };
    // Com notinha ou subcompras o gasto vai por RPC: gasto, itens e foto entram
    // numa transação só. `items_count` cobre o caso de o usuário ter apagado
    // todos os itens de um gasto que já tinha.
    const usesItems =
      receiptState.items.length > 0 ||
      receiptState.receipt !== null ||
      (expense?.items_count ?? 0) > 0;

    if (expense) {
      if (usesItems) {
        await saveExpenseWithItems({
          expense: payload,
          items: receiptState.items,
          receiptId: receiptState.receipt?.id ?? null,
          expenseId: expense.id,
        });
        receiptState.markSaved();
      } else {
        await updateExpense(expense.id, payload);
      }
    } else {
      const created = usesItems
        ? await saveExpenseWithItems({
            expense: payload,
            items: receiptState.items,
            receiptId: receiptState.receipt?.id ?? null,
          })
        : await addExpense(payload);
      if (created) receiptState.markSaved();
      rememberDate(date);
    }
    setSaving(false);
    if (keepOpen && !expense) {
      setFlash({ id: Date.now(), label: `${formatBRL(amount)} lançado` });
      setRaw('');
      setNote('');
      receiptState.reset();
      amountRef.current?.focus();
      return;
    }
    onClose();
  }

  async function handleDelete() {
    if (!expense) return;
    setDeleting(true);
    await deleteExpense(expense.id);
    setDeleting(false);
    setConfirmDelete(false);
    onClose();
  }

  const calendar = (
    <Calendar
      selected={fromISODate(date)}
      onSelect={(d) => {
        setDate(toISODate(d));
        setDateTouched(true);
        setShowCalendar(false);
      }}
    />
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? 'Editar gasto' : 'Novo gasto'}
      maxWidth={560}
      sidePanel={showCalendar ? calendar : null}
    >
      {/* Valor */}
      <div className="mb-5 text-center">
        <div
          className="inline-flex items-baseline gap-1 rounded-2xl px-6 py-4"
          style={{ backgroundColor: colors.surface }}
        >
          <span className="text-2xl font-bold" style={{ color: colors.textMuted }}>R$</span>
          <input
            ref={amountRef}
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
                setDateTouched(true);
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

      {/* Telas estreitas: embaixo mesmo. No desktop vai pro painel lateral do Modal. */}
      {showCalendar && (
        <div ref={inlineCalendarRef} className="mb-4 lg:hidden">
          {calendar}
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

      {/* Notinha + subcompras. Os itens detalham o gasto; o total do mês
          continua sendo só o valor do lançamento. */}
      <ReceiptFields
        receipt={receiptState.receipt}
        items={receiptState.items}
        phase={receiptState.phase}
        error={receiptState.error}
        mismatch={receiptState.mismatch}
        duplicate={receiptState.duplicate}
        photoUrl={receiptState.photoUrl}
        expenseAmount={amount}
        onAttach={receiptState.attach}
        onAttachQr={receiptState.attachQr}
        onRetry={receiptState.retry}
        onRemove={receiptState.remove}
        onChangeItems={receiptState.setItems}
        onUseItemsTotal={(value) => setRaw(reaisToRaw(value))}
      />

      <div className="mt-6 flex items-center gap-3">
        {expense && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl px-4 py-3 text-sm font-bold transition hover:opacity-80"
            style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
          >
            Excluir
          </button>
        )}
        {!expense && (
          <button
            onClick={() => handleSave({ keepOpen: true })}
            disabled={!canSave || saving}
            className="ml-auto flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colors.surface, color: colors.text }}
            title="Salva e já abre outro com a mesma data e categoria"
          >
            <AppIcon icon="plus" size={16} color={colors.primary} />
            Salvar e lançar outro
          </button>
        )}
        <button
          onClick={() => handleSave()}
          disabled={!canSave || saving}
          className={`${expense ? 'ml-auto' : ''} rounded-xl px-6 py-3 font-bold transition hover:opacity-90 disabled:opacity-50`}
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          {saving ? 'Salvando…' : expense ? 'Salvar' : 'Adicionar'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir este gasto?"
        message="O lançamento some do histórico e dos gráficos. Não dá pra desfazer."
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {flash && (
        <SuccessFlash key={flash.id} message={flash.label} onDone={() => setFlash(null)} />
      )}
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
