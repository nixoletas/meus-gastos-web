'use client';

import { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useLedger } from '../context/LedgerContext';
import {
  BANK_PROVIDERS,
  GENERIC_PROVIDERS,
  getProvider,
  KIND_ICONS,
  matchesProvider,
  PAYMENT_KINDS,
  PaymentProvider,
} from '../data/paymentProviders';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { PaymentKind, PaymentMethod } from '../types';
import { paymentLabel } from '../utils/payment';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { PaymentLogo } from './PaymentLogo';

type Props = {
  open: boolean;
  onClose: () => void;
  method?: PaymentMethod | null;
  /** Chamado com o meio recém-criado (o lançamento já o seleciona). */
  onCreated?: (method: PaymentMethod) => void;
};

/**
 * Cadastro de meio de pagamento: instituição (com logo) + forma.
 * O nome nasce do banco escolhido e pode virar apelido.
 */
export function PaymentMethodModal({ open, onClose, method, onCreated }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const { canWrite } = useLedger();
  const { addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useData();

  const [provider, setProvider] = useState<string | null>(null);
  const [kind, setKind] = useState<PaymentKind>('credito');
  const [name, setName] = useState('');
  /** Nome digitado à mão não é trocado ao escolher outro banco. */
  const [nameTouched, setNameTouched] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setConfirmDelete(false);
    if (method) {
      setProvider(method.provider);
      setKind(method.kind);
      setName(method.name);
      setNameTouched(true);
    } else {
      setProvider(null);
      setKind('credito');
      setName('');
      setNameTouched(false);
    }
  }, [open, method]);

  const providerName = (p: PaymentProvider) => t.payment.providers[p.id] ?? p.name;

  function pickProvider(p: PaymentProvider) {
    setProvider(p.id);
    if (p.defaultKind) setKind(p.defaultKind);
    if (!nameTouched) setName(providerName(p));
  }

  const banks = useMemo(() => BANK_PROVIDERS.filter((p) => matchesProvider(p, search)), [search]);
  const generics = useMemo(
    () =>
      GENERIC_PROVIDERS.filter(
        (p) => matchesProvider(p, search) || matchesProvider({ ...p, name: providerName(p) }, search)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, t]
  );

  const color = getProvider(provider)?.color ?? colors.primary;
  const canSave = name.trim().length > 0 && !saving && canWrite;

  const previewLabel = paymentLabel(
    {
      id: '',
      user_id: '',
      name: name.trim() || t.payment.namePlaceholder,
      provider,
      kind,
      color,
      position: 0,
      created_at: '',
    },
    t
  );

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const payload = { name: name.trim(), provider, kind, color };
    if (method) {
      await updatePaymentMethod(method.id, payload);
    } else {
      const created = await addPaymentMethod(payload);
      if (created) onCreated?.(created);
    }
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!method) return;
    setDeleting(true);
    await deletePaymentMethod(method.id);
    setDeleting(false);
    setConfirmDelete(false);
    onClose();
  }

  const renderProvider = (p: PaymentProvider) => {
    const active = provider === p.id;
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => pickProvider(p)}
        className="flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition hover:opacity-90"
        style={{
          backgroundColor: active ? hexWithAlpha(p.color, 0.14) : colors.surface,
          borderColor: active ? p.color : 'transparent',
          borderWidth: 1.5,
        }}
      >
        <PaymentLogo provider={p.id} size={38} />
        <span className="w-full truncate text-center text-[11px] font-semibold" style={{ color: colors.text }}>
          {providerName(p)}
        </span>
      </button>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={method ? t.payment.editTitle : t.payment.newTitle}
      maxWidth={600}
    >
      {/* Pré-visualização */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: colors.surface }}>
        <PaymentLogo provider={provider} kind={kind} color={color} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold" style={{ color: colors.text }}>
            {previewLabel}
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: colors.textMuted }}>
            <AppIcon icon={KIND_ICONS[kind]} size={14} color={colors.textMuted} />
            {t.payment.kinds[kind]}
          </div>
        </div>
      </div>

      <Label>{t.payment.kind}</Label>
      <div className="mb-5 flex flex-wrap gap-2">
        {PAYMENT_KINDS.map((k) => {
          const active = k === kind;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition"
              style={{
                backgroundColor: active ? colors.primary : colors.surface,
                color: active ? colors.onPrimary : colors.text,
              }}
            >
              <AppIcon icon={KIND_ICONS[k]} size={16} color={active ? colors.onPrimary : colors.textMuted} />
              {t.payment.kinds[k]}
            </button>
          );
        })}
      </div>

      <Label>{t.payment.institution}</Label>
      <div
        className="mb-3 flex items-center gap-2 rounded-xl border px-3"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <AppIcon icon="magnify" size={18} color={colors.textMuted} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.payment.searchPlaceholder}
          className="flex-1 bg-transparent py-2.5 text-sm outline-none"
          style={{ color: colors.text }}
        />
      </div>
      {banks.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{banks.map(renderProvider)}</div>
      )}
      {generics.length > 0 && (
        <>
          <div className="mb-2 mt-3 text-xs font-bold" style={{ color: colors.textMuted }}>
            {t.payment.others}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{generics.map(renderProvider)}</div>
        </>
      )}

      <div className="mt-5">
        <Label>{t.payment.name}</Label>
        <input
          value={name}
          maxLength={60}
          onChange={(e) => {
            setName(e.target.value);
            setNameTouched(e.target.value.trim().length > 0);
          }}
          placeholder={t.payment.namePlaceholder}
          className="w-full rounded-xl border px-3 py-2.5 outline-none"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
        />
        <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
          {t.payment.nameHint}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {method && canWrite && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl px-4 py-3 text-sm font-bold transition hover:opacity-80"
            style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
          >
            {t.common.delete}
          </button>
        )}
        {canWrite && (
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="ml-auto rounded-xl px-6 py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            {saving ? t.web.saving : t.common.save}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t.payment.deleteTitle(method ? paymentLabel(method, t) : name)}
        message={t.payment.deleteMessage}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
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
