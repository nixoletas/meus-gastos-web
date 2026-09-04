'use client';

import { useRef, useState } from 'react';
import { useT } from '../i18n';
import { getActiveLang } from '../i18n/active';
import { newDraftItem, sumItems } from '../lib/receipts';
import { ReceiptPhase } from '../lib/useReceipt';
import { useTheme } from '../theme/ThemeContext';
import { DraftItem, Receipt } from '../types';
import { formatBRL, maskCurrencyInput, rawToReais, reaisToRaw } from '../utils/currency';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';

type Props = {
  receipt: Receipt | null;
  items: DraftItem[];
  phase: ReceiptPhase;
  error: string | null;
  /** A soma dos itens não bate com o total impresso na nota. */
  mismatch: boolean;
  /** Id do gasto que já usou esta mesma nota fiscal. */
  duplicate: string | null;
  photoUrl: string | null;
  /** Valor digitado no lançamento, para comparar com a soma dos itens. */
  expenseAmount: number;
  onAttach: (file: File) => void;
  onAttachQr: (qrUrl: string) => void;
  onRetry: () => void;
  onRemove: () => void;
  onChangeItems: (items: DraftItem[]) => void;
  /** Caderno de outra pessoa em que só se pode olhar: nada de anexar ou editar. */
  readOnly?: boolean;
  onUseItemsTotal: (total: number) => void;
};

function issuedLabel(
  iso: string | null,
  join: (date: string, time: string) => string
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  const dia = pad(date.getDate());
  const mes = pad(date.getMonth() + 1);
  const dataCurta = getActiveLang() === 'en' ? `${mes}/${dia}` : `${dia}/${mes}`;
  return join(dataCurta, `${pad(date.getHours())}:${pad(date.getMinutes())}`);
}

/** Quantidade com o separador decimal do idioma ativo. */
function formatQuantity(value: number): string {
  const texto = String(value);
  return getActiveLang() === 'en' ? texto : texto.replace('.', ',');
}

/**
 * Notinha + subcompras no modal de lançamento.
 *
 * As subcompras detalham o gasto; elas não somam no total do mês — quem manda
 * no total continua sendo o valor do lançamento.
 */
export function ReceiptFields({
  receipt,
  items,
  phase,
  error,
  mismatch,
  duplicate,
  photoUrl,
  expenseAmount,
  onAttach,
  onAttachQr,
  onRetry,
  onRemove,
  onChangeItems,
  readOnly = false,
  onUseItemsTotal,
}: Props) {
  const { colors } = useTheme();
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [qrLink, setQrLink] = useState('');

  const total = sumItems(items);
  const busy = phase === 'uploading' || phase === 'reading';
  // Diferença de centavos vem de arredondamento da nota, não vale alarde.
  const differsFromExpense = items.length > 0 && Math.abs(total - expenseAmount) > 0.05;

  const meta = [
    issuedLabel(receipt?.issued_at ?? null, t.receiptSection.issuedAt),
    receipt?.payment_method
      ? t.receiptSection.payment[
          receipt.payment_method as keyof typeof t.receiptSection.payment
        ] ?? null
      : null,
    receipt?.total != null
      ? t.receiptSection.receiptTotal(formatBRL(Number(receipt.total)))
      : null,
  ].filter(Boolean) as string[];

  function update(key: string, patch: Partial<DraftItem>) {
    onChangeItems(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  /** Aceita o arquivo arrastado, seja da área de trabalho ou de outra aba. */
  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;

    const file = [...event.dataTransfer.files].find((f) => f.type.startsWith('image/'));
    if (file) {
      onAttach(file);
      return;
    }
    // Arrastar o link do QR (de um e-mail, de outra aba) também vale.
    const texto = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text');
    if (texto && /^https:\/\//i.test(texto.trim())) onAttachQr(texto.trim());
  }

  function enviarLink() {
    const valor = qrLink.trim();
    if (!/^https:\/\//i.test(valor)) return;
    setQrLink('');
    onAttachQr(valor);
  }

  // Num caderno alheio sem notinha nem itens não há nada a mostrar.
  if (readOnly && !receipt && items.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
          {t.receiptSection.label}
        </span>
        {items.length > 0 && (
          <span className="text-xs font-semibold" style={{ color: colors.textMuted }}>
            {t.receiptSection.countAndTotal(items.length, formatBRL(total))}
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        // No celular abre direto a câmera traseira; no desktop, o seletor.
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onAttach(file);
        }}
      />

      {!receipt && !busy && !readOnly && (
        <>
          {/* Arrastar o cupom é o gesto natural de quem já tem a foto no
              computador; o clique continua funcionando para todo o resto. */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-6 text-sm font-bold transition hover:opacity-80"
            style={{
              borderColor: dragging ? colors.primary : colors.border,
              backgroundColor: dragging ? colors.primarySoft : 'transparent',
              color: colors.primary,
            }}
          >
            <AppIcon icon="camera" size={20} color={colors.primary} />
            {dragging ? t.web.dropPhotoHere : t.web.dragOrClick}
          </button>

          {/* Caminho exato: o link do QR não passa por leitura de imagem. */}
          <div className="mt-2 flex gap-2">
            <input
              value={qrLink}
              onChange={(e) => setQrLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  enviarLink();
                }
              }}
              placeholder={t.web.qrLinkPlaceholder}
              className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
            <button
              type="button"
              onClick={enviarLink}
              disabled={!/^https:\/\//i.test(qrLink.trim())}
              className="rounded-xl px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >
              {t.web.readReceipt}
            </button>
          </div>

          <div className="mt-1.5 text-xs" style={{ color: colors.textMuted }}>
            {t.web.receiptHint}
          </div>
        </>
      )}

      {busy && (
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <div className="mb-3 text-sm font-semibold" style={{ color: colors.text }}>
            {phase === 'uploading'
              ? t.receiptSection.uploading
              : receipt?.source === 'qrcode'
                ? t.receiptSection.queryingSefaz
                : t.receiptSection.readingReceipt}
          </div>
          <div className="space-y-2">
            {['82%', '64%', '73%'].map((width) => (
              <div
                key={width}
                className="h-3 animate-pulse rounded"
                style={{ width, backgroundColor: colors.border }}
              />
            ))}
          </div>
          <div className="mt-3 text-xs" style={{ color: colors.textMuted }}>
            {t.receiptSection.keepGoing}
          </div>
        </div>
      )}

      {phase === 'failed' && !busy && (
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: colors.dangerSoft, borderColor: hexWithAlpha(colors.danger, 0.35) }}
        >
          <div className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
            {error ?? t.receiptSection.readFailed}
          </div>
          {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {!!receipt && (
              <SmallButton onClick={onRetry} colors={colors}>
                {t.common.tryAgain}
              </SmallButton>
            )}
            <SmallButton onClick={() => fileRef.current?.click()} colors={colors}>
              {t.receiptSection.anotherPhoto}
            </SmallButton>
            {!!receipt && (
              <SmallButton onClick={onRemove} colors={colors} tone={colors.danger}>
                {t.common.remove}
              </SmallButton>
            )}
          </div>
          )}
        </div>
      )}

      {!!receipt && !busy && phase !== 'failed' && (
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <a href={photoUrl} target="_blank" rel="noreferrer" title={t.web.seeWholeReceipt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt={t.web.receiptPhotoAlt}
                  className="h-16 w-12 rounded-lg object-cover"
                />
              </a>
            ) : (
              <div
                className="flex h-16 w-12 items-center justify-center rounded-lg text-xl"
                style={{ backgroundColor: colors.surface, color: colors.textMuted }}
                title={receipt.source === 'qrcode' ? t.web.readByQr : t.web.noPhoto}
              >
                {receipt.source === 'qrcode' ? '▦' : '🧾'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold" style={{ color: colors.text }}>
                {receipt.merchant ??
                  (receipt.source === 'qrcode'
                    ? t.receiptSection.taxReceipt
                    : t.receiptSection.attachedReceipt)}
              </div>
              {meta.length > 0 && (
                <div className="truncate text-xs" style={{ color: colors.textMuted }}>
                  {meta.join(' · ')}
                </div>
              )}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onRemove}
                title={t.web.removeReceipt}
                className="rounded-lg px-2 py-1 text-xs font-bold transition hover:opacity-80"
                style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
              >
                {t.common.remove}
              </button>
            )}
          </div>

          {!!duplicate && (
            <div
              className="mt-3 rounded-lg p-2 text-xs"
              style={{ backgroundColor: hexWithAlpha(colors.warning, 0.14), color: colors.text }}
            >
              {t.receiptSection.duplicate}
            </div>
          )}

          {mismatch && (
            <div
              className="mt-3 rounded-lg p-2 text-xs"
              style={{ backgroundColor: hexWithAlpha(colors.warning, 0.14), color: colors.text }}
            >
              {t.receiptSection.mismatch(
                formatBRL(total),
                formatBRL(Number(receipt.total ?? 0))
              )}
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div
          className="mt-2 overflow-hidden rounded-xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.card }}
        >
          {items.map((item, index) => (
            <div
              key={item.key}
              className="flex items-center gap-2 px-2 py-1.5"
              style={{ borderTop: index > 0 ? `1px solid ${colors.border}` : undefined }}
            >
              <input
                value={item.description}
                readOnly={readOnly}
                onChange={(e) => update(item.key, { description: e.target.value })}
                placeholder={t.web.itemDescriptionPlaceholder}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1"
                style={{ color: colors.text }}
              />
              <input
                value={formatQuantity(item.quantity)}
                readOnly={readOnly}
                onChange={(e) => {
                  const parsed = Number.parseFloat(e.target.value.replace(',', '.'));
                  update(item.key, { quantity: Number.isFinite(parsed) && parsed > 0 ? parsed : 1 });
                }}
                title={t.itemEditor.quantity}
                className="w-14 rounded-lg px-2 py-1.5 text-center text-xs outline-none"
                style={{ backgroundColor: colors.surface, color: colors.textMuted }}
              />
              <input
                inputMode="numeric"
                readOnly={readOnly}
                value={maskCurrencyInput(reaisToRaw(item.total))}
                onChange={(e) => update(item.key, { total: rawToReais(e.target.value) })}
                className="w-24 rounded-lg px-2 py-1.5 text-right text-sm font-bold outline-none"
                style={{ backgroundColor: colors.surface, color: colors.text }}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onChangeItems(items.filter((other) => other.key !== item.key))}
                  title={t.web.removeItem}
                  className="px-1 text-lg leading-none transition hover:opacity-70"
                  style={{ color: colors.textMuted }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
      <div className="mt-2 flex flex-wrap gap-2">
        <SmallButton
          onClick={() => onChangeItems([...items, newDraftItem()])}
          colors={colors}
          tone={colors.primary}
        >
          {t.web.addItemPlus}
        </SmallButton>

        {/* O OCR quase sempre acerta o total; trocar tem que ser um clique. */}
        {differsFromExpense && (
          <SmallButton onClick={() => onUseItemsTotal(total)} colors={colors} tone={colors.primary}>
            {t.receiptSection.useTotal(formatBRL(total))}
          </SmallButton>
        )}
      </div>
      )}
    </div>
  );
}

function SmallButton({
  children,
  onClick,
  colors,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  colors: { surface: string; text: string };
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
      style={{ backgroundColor: colors.surface, color: tone ?? colors.text }}
    >
      {children}
    </button>
  );
}
