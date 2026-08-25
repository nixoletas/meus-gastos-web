'use client';

/**
 * Notinhas na web: escolher o arquivo, reduzir no canvas, enviar e mandar ler.
 *
 * Mesma Edge Function do app (`parse-receipt`) e mesmo bucket privado
 * `receipts`. A diferença é só a origem da foto: aqui é um `<input type=file>`
 * (que no celular já abre a câmera com `capture`).
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { DraftItem, ExpenseItem, Receipt } from '../types';

/**
 * Cupom é alto e estreito: escalar pelo maior lado deixaria o texto ilegível.
 * Fixamos a largura e só cortamos a altura em nota absurdamente longa.
 */
const TARGET_WIDTH = 1400;
const MAX_HEIGHT = 2800;
const JPEG_QUALITY = 0.72;

export type ParseResult = {
  receipt: Receipt;
  items: ExpenseItem[];
  itemsTotal: number;
  /** A soma dos itens não fecha com o total impresso na nota. */
  mismatch: boolean;
};

/** Reduz a foto antes do upload: menos espera no 4G e imagem mais barata de ler. */
export async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  let width = Math.min(TARGET_WIDTH, bitmap.width);
  let height = Math.round((bitmap.height * width) / bitmap.width);
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = Math.round((bitmap.width * height) / bitmap.height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não consegui preparar a foto neste navegador.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  if (!blob) throw new Error('Não consegui preparar a foto. Tente outra.');
  return blob;
}

function randomName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
}

export async function uploadReceipt(
  supabase: SupabaseClient,
  userId: string,
  blob: Blob
): Promise<Receipt> {
  const path = `${userId}/${randomName()}`;
  const { error: uploadErr } = await supabase.storage
    .from('receipts')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (uploadErr) throw new Error(`Não consegui enviar a foto: ${uploadErr.message}`);

  const { data, error } = await supabase
    .from('receipts')
    .insert({ user_id: userId, expense_id: null, storage_path: path, status: 'pending' })
    .select()
    .single();

  if (error || !data) {
    // Não deixa lixo no bucket se o insert falhou.
    await supabase.storage.from('receipts').remove([path]);
    throw new Error(error?.message ?? 'Não consegui registrar a notinha.');
  }
  return data as Receipt;
}

export async function parseReceipt(
  supabase: SupabaseClient,
  receiptId: string
): Promise<ParseResult> {
  const { data, error } = await supabase.functions.invoke<ParseResult>('parse-receipt', {
    body: { receipt_id: receiptId },
  });

  if (error) {
    // A mensagem da função é escrita para o usuário ler ("tire outra foto"),
    // então vale mais que a genérica do cliente.
    let message = error.message;
    try {
      const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
      if (ctx?.json) {
        const parsed = await ctx.json();
        message = parsed?.error ?? message;
      }
    } catch {
      /* fica com a mensagem genérica */
    }
    throw new Error(message ?? 'Não consegui ler a notinha.');
  }
  if (!data) throw new Error('Não consegui ler a notinha.');
  return data;
}

export async function discardReceipt(supabase: SupabaseClient, receipt: Receipt): Promise<void> {
  await supabase.rpc('discard_receipt', { p_receipt_id: receipt.id });
  await supabase.storage.from('receipts').remove([receipt.storage_path]);
}

/** URL temporária para exibir a foto (o bucket é privado). */
export async function receiptSignedUrl(
  supabase: SupabaseClient,
  path: string,
  seconds = 3600
): Promise<string | null> {
  const { data } = await supabase.storage.from('receipts').createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

export async function loadReceiptOfExpense(
  supabase: SupabaseClient,
  expenseId: string
): Promise<Receipt | null> {
  const { data } = await supabase
    .from('receipts')
    .select('*')
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Receipt) ?? null;
}

export async function loadItemsOfExpense(
  supabase: SupabaseClient,
  expenseId: string
): Promise<ExpenseItem[]> {
  const { data } = await supabase
    .from('expense_items')
    .select('*')
    .eq('expense_id', expenseId)
    .order('position');
  return (data ?? []) as ExpenseItem[];
}

let draftSeq = 0;

export function newDraftItem(partial: Partial<DraftItem> = {}): DraftItem {
  draftSeq += 1;
  return {
    key: `draft-${draftSeq}`,
    description: '',
    raw_text: null,
    quantity: 1,
    unit: null,
    unit_price: null,
    total: 0,
    category_id: null,
    ...partial,
  };
}

/** Converte as linhas do banco no formato que a lista editável usa. */
export function toDraftItems(rows: ExpenseItem[]): DraftItem[] {
  return rows.map((row) => ({
    key: row.id,
    description: row.description,
    raw_text: row.raw_text,
    quantity: Number(row.quantity) || 1,
    unit: row.unit,
    unit_price: row.unit_price === null ? null : Number(row.unit_price),
    total: Number(row.total) || 0,
    category_id: row.category_id,
  }));
}

export const sumItems = (items: DraftItem[]): number =>
  Math.round(items.reduce((total, item) => total + (Number(item.total) || 0), 0) * 100) / 100;
