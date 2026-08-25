'use client';

import { useRef, useState } from 'react';
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
  onUseItemsTotal: (total: number) => void;
};

const PAYMENT_LABEL: Record<string, string> = {
  credito: 'Crédito',
  debito: 'Débito',
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  vale: 'Vale',
  outro: 'Outro',
};

function issuedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
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
  onUseItemsTotal,
}: Props) {
  const { colors } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [qrLink, setQrLink] = useState('');

  const total = sumItems(items);
  const busy = phase === 'uploading' || phase === 'reading';
  // Diferença de centavos vem de arredondamento da nota, não vale alarde.
  const differsFromExpense = items.length > 0 && Math.abs(total - expenseAmount) > 0.05;

  const meta = [
    issuedLabel(receipt?.issued_at ?? null),
    receipt?.payment_method ? PAYMENT_LABEL[receipt.payment_method] ?? null : null,
    receipt?.total != null ? `Total na nota: ${formatBRL(Number(receipt.total))}` : null,
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

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
          Notinha e itens
        </span>
        {items.length > 0 && (
          <span className="text-xs font-semibold" style={{ color: colors.textMuted }}>
            {items.length} {items.length === 1 ? 'item' : 'itens'} · {formatBRL(total)}
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

      {!receipt && !busy && (
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
            {dragging ? 'Solte a foto aqui' : 'Arraste a foto da nota ou clique para escolher'}
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
              placeholder="ou cole aqui o link do QR Code do cupom"
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
              Ler nota
            </button>
          </div>

          <div className="mt-1.5 text-xs" style={{ color: colors.textMuted }}>
            Com o link do QR, os itens vêm direto da SEFAZ, sem enviar imagem. Na
            foto, quem lê é o Google — e ela funciona em qualquer recibo.
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
              ? 'Enviando a foto…'
              : receipt?.source === 'qrcode'
                ? 'Consultando a nota na SEFAZ…'
                : 'Lendo sua notinha…'}
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
            Pode continuar preenchendo, eu aviso quando terminar.
          </div>
        </div>
      )}

      {phase === 'failed' && !busy && (
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: colors.dangerSoft, borderColor: hexWithAlpha(colors.danger, 0.35) }}
        >
          <div className="mb-2 text-sm font-semibold" style={{ color: colors.text }}>
            {error ?? 'Não consegui ler essa foto.'}
          </div>
          <div className="flex flex-wrap gap-2">
            {!!receipt && (
              <SmallButton onClick={onRetry} colors={colors}>
                Tentar de novo
              </SmallButton>
            )}
            <SmallButton onClick={() => fileRef.current?.click()} colors={colors}>
              Outra foto
            </SmallButton>
            {!!receipt && (
              <SmallButton onClick={onRemove} colors={colors} tone={colors.danger}>
                Remover
              </SmallButton>
            )}
          </div>
        </div>
      )}

      {!!receipt && !busy && phase !== 'failed' && (
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <a href={photoUrl} target="_blank" rel="noreferrer" title="Ver a nota inteira">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Foto da nota"
                  className="h-16 w-12 rounded-lg object-cover"
                />
              </a>
            ) : (
              <div
                className="flex h-16 w-12 items-center justify-center rounded-lg text-xl"
                style={{ backgroundColor: colors.surface, color: colors.textMuted }}
                title={receipt.source === 'qrcode' ? 'Notinha lida pelo QR Code' : 'Sem foto'}
              >
                {receipt.source === 'qrcode' ? '▦' : '🧾'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold" style={{ color: colors.text }}>
                {receipt.merchant ?? (receipt.source === 'qrcode' ? 'Nota fiscal' : 'Notinha anexada')}
              </div>
              {meta.length > 0 && (
                <div className="truncate text-xs" style={{ color: colors.textMuted }}>
                  {meta.join(' · ')}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              title="Remover a notinha"
              className="rounded-lg px-2 py-1 text-xs font-bold transition hover:opacity-80"
              style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
            >
              Remover
            </button>
          </div>

          {!!duplicate && (
            <div
              className="mt-3 rounded-lg p-2 text-xs"
              style={{ backgroundColor: hexWithAlpha(colors.warning, 0.14), color: colors.text }}
            >
              Essa nota fiscal já foi lançada antes. Se não for engano, pode continuar.
            </div>
          )}

          {mismatch && (
            <div
              className="mt-3 rounded-lg p-2 text-xs"
              style={{ backgroundColor: hexWithAlpha(colors.warning, 0.14), color: colors.text }}
            >
              Os itens somam {formatBRL(total)}, mas a nota diz{' '}
              {formatBRL(Number(receipt.total ?? 0))}. Confira as linhas.
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
                onChange={(e) => update(item.key, { description: e.target.value })}
                placeholder="Descrição do item"
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1"
                style={{ color: colors.text }}
              />
              <input
                value={String(item.quantity).replace('.', ',')}
                onChange={(e) => {
                  const parsed = Number.parseFloat(e.target.value.replace(',', '.'));
                  update(item.key, { quantity: Number.isFinite(parsed) && parsed > 0 ? parsed : 1 });
                }}
                title="Quantidade"
                className="w-14 rounded-lg px-2 py-1.5 text-center text-xs outline-none"
                style={{ backgroundColor: colors.surface, color: colors.textMuted }}
              />
              <input
                inputMode="numeric"
                value={maskCurrencyInput(reaisToRaw(item.total))}
                onChange={(e) => update(item.key, { total: rawToReais(e.target.value) })}
                className="w-24 rounded-lg px-2 py-1.5 text-right text-sm font-bold outline-none"
                style={{ backgroundColor: colors.surface, color: colors.text }}
              />
              <button
                type="button"
                onClick={() => onChangeItems(items.filter((other) => other.key !== item.key))}
                title="Remover item"
                className="px-1 text-lg leading-none transition hover:opacity-70"
                style={{ color: colors.textMuted }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <SmallButton
          onClick={() => onChangeItems([...items, newDraftItem()])}
          colors={colors}
          tone={colors.primary}
        >
          + Adicionar item
        </SmallButton>

        {/* O OCR quase sempre acerta o total; trocar tem que ser um clique. */}
        {differsFromExpense && (
          <SmallButton onClick={() => onUseItemsTotal(total)} colors={colors} tone={colors.primary}>
            Usar {formatBRL(total)}
          </SmallButton>
        )}
      </div>
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
