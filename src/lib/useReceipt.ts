'use client';

/**
 * Estado da notinha dentro do modal de lançamento (web).
 *
 * A foto sobe sempre com `expense_id` nulo — é rascunho até o usuário
 * confirmar o gasto. Quem amarra notinha, itens e gasto é a RPC
 * `save_expense_with_items`, numa transação só. Fechou o modal sem salvar,
 * o rascunho é apagado (linha + arquivo no Storage).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useAuth } from '../context/AuthContext';
import { tNow } from '../i18n';
import { DraftItem, Receipt } from '../types';
import {
  createQrReceipt,
  discardReceipt,
  loadItemsOfExpense,
  loadReceiptOfExpense,
  parseNfce,
  ParseResult,
  parseReceipt,
  prepareImage,
  qrFromImage,
  receiptSignedUrl,
  toDraftItems,
  uploadReceipt,
} from './receipts';

export type ReceiptPhase = 'idle' | 'uploading' | 'reading' | 'ready' | 'failed';

type Options = {
  /** Gasto sendo editado; nulo quando é lançamento novo. */
  expenseId: string | null;
  /** O modal está aberto — fora disso não carregamos nada. */
  active: boolean;
  /** Chamado quando o OCR termina: a tela usa para preencher valor e data. */
  onParsed?: (result: ParseResult) => void;
};

export function useReceipt({ expenseId, active, onParsed }: Options) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [phase, setPhase] = useState<ReceiptPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  /** Id do gasto que já usou esta mesma nota fiscal. */
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  /** Notinha criada nesta sessão e ainda não salva — some se o modal fechar. */
  const pendingRef = useRef<Receipt | null>(null);
  const onParsedRef = useRef(onParsed);
  onParsedRef.current = onParsed;

  const clear = useCallback(() => {
    pendingRef.current = null;
    setReceipt(null);
    setItems([]);
    setPhotoUrl(null);
    setPhase('idle');
    setError(null);
    setMismatch(false);
    setDuplicate(null);
  }, []);

  // Abriu para editar um gasto: traz a notinha e os itens já salvos.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    clear();
    if (!expenseId) return;

    (async () => {
      const [saved, savedItems] = await Promise.all([
        loadReceiptOfExpense(supabase, expenseId),
        loadItemsOfExpense(supabase, expenseId),
      ]);
      if (!alive) return;

      if (saved) {
        setReceipt(saved);
        setPhase(saved.status === 'failed' ? 'failed' : 'ready');
        setError(saved.error);
        // Notinha vinda de QR Code não tem foto para exibir.
        if (saved.storage_path) {
          const url = await receiptSignedUrl(supabase, saved.storage_path);
          if (alive) setPhotoUrl(url);
        }
      }
      if (savedItems.length > 0) setItems(toDraftItems(savedItems));
    })();

    return () => {
      alive = false;
    };
  }, [active, expenseId, supabase, clear]);

  // Rascunho abandonado não pode ficar ocupando o bucket nem virando item solto.
  useEffect(() => {
    if (active) return;
    const pending = pendingRef.current;
    if (pending) {
      pendingRef.current = null;
      void discardReceipt(supabase, pending);
    }
  }, [active, supabase]);

  const runParse = useCallback(
    async (target: Receipt) => {
      setPhase('reading');
      setError(null);
      // Cada origem tem seu leitor: QR consulta a SEFAZ, foto vai para o modelo.
      const result =
        target.source === 'qrcode'
          ? await parseNfce(supabase, target.id)
          : await parseReceipt(supabase, target.id);
      setReceipt(result.receipt);
      pendingRef.current = result.receipt;
      setItems(toDraftItems(result.items));
      setMismatch(result.mismatch);
      setDuplicate(result.duplicate ?? null);
      setPhase('ready');
      onParsedRef.current?.(result);
    },
    [supabase]
  );

  /**
   * QR Code do cupom: os itens vêm do portal da SEFAZ, exatos e de graça.
   * Na web o valor chega colado pelo usuário ou lido de dentro da imagem.
   */
  const attachQr = useCallback(
    async (qrUrl: string) => {
      if (!user) return;
      try {
        setError(null);
        const previous = receipt;
        setPhase('reading');
        setMismatch(false);
        setDuplicate(null);
        setPhotoUrl(null);

        const created = await createQrReceipt(supabase, user.id, qrUrl);
        pendingRef.current = created;
        setReceipt(created);
        if (previous) void discardReceipt(supabase, previous);

        await runParse(created);
      } catch (err) {
        setPhase('failed');
        setError(err instanceof Error ? err.message : tNow().errors.readQr);
      }
    },
    [user, supabase, receipt, runParse]
  );

  const attach = useCallback(
    async (file: File) => {
      if (!user) return;
      try {
        setError(null);
        setPhase('uploading');
        setMismatch(false);
        setDuplicate(null);

        // Foto do cupom com QR legível: a consulta na SEFAZ é exata e não
        // manda imagem nenhuma para fora. Só cai no OCR quando não dá.
        const scanned = await qrFromImage(file);
        if (scanned) {
          await attachQr(scanned);
          return;
        }

        const blob = await prepareImage(file);
        setPhotoUrl(URL.createObjectURL(blob)); // prévia local, sem esperar URL assinada

        // Trocar de foto não pode deixar a anterior órfã no bucket.
        const previous = receipt;
        const created = await uploadReceipt(supabase, user.id, blob);
        pendingRef.current = created;
        setReceipt(created);
        if (previous) void discardReceipt(supabase, previous);

        await runParse(created);
      } catch (err) {
        setPhase('failed');
        setError(err instanceof Error ? err.message : tNow().errors.readReceipt);
      }
    },
    [user, supabase, receipt, runParse, attachQr]
  );

  const retry = useCallback(async () => {
    if (!receipt) return;
    try {
      await runParse(receipt);
    } catch (err) {
      setPhase('failed');
      setError(err instanceof Error ? err.message : tNow().errors.readReceipt);
    }
  }, [receipt, runParse]);

  const remove = useCallback(async () => {
    const target = receipt;
    clear();
    if (target) await discardReceipt(supabase, target);
  }, [receipt, supabase, clear]);

  /** Chamado depois de salvar: o rascunho virou gasto de verdade. */
  const markSaved = useCallback(() => {
    pendingRef.current = null;
  }, []);

  return {
    receipt,
    items,
    setItems,
    phase,
    error,
    mismatch,
    duplicate,
    photoUrl,
    attach,
    attachQr,
    retry,
    remove,
    markSaved,
    reset: clear,
    busy: phase === 'uploading' || phase === 'reading',
  };
}
