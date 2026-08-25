'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { loadItemsOfExpense } from '../lib/receipts';
import { useTheme } from '../theme/ThemeContext';
import { ExpenseItem } from '../types';
import { formatBRL } from '../utils/currency';

type Props = {
  expenseId: string;
  /** Cor da categoria, para o item continuar visualmente ligado ao gasto. */
  color: string;
};

/** "1,24 kg" ou "3 un" — só aparece quando diz alguma coisa. */
function quantidadeLabel(quantity: number, unit: string | null): string | null {
  const valor = Number(quantity);
  if (!Number.isFinite(valor) || valor <= 0) return null;
  if (valor === 1 && !unit) return null;
  const numero = Number.isInteger(valor)
    ? String(valor)
    : valor.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
  return `${numero} ${unit ?? 'un'}`;
}

/**
 * As subcompras de um gasto, abertas dentro dele.
 *
 * Busca sob demanda: só o lançamento que a pessoa abriu vai ao banco. Item
 * não tem data própria — ele pertence ao gasto, e é aí que faz sentido ler.
 */
export function ExpenseItems({ expenseId, color }: Props) {
  const { colors } = useTheme();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<ExpenseItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    loadItemsOfExpense(supabase, expenseId).then((rows) => {
      if (alive) setItems(rows);
    });
    return () => {
      alive = false;
    };
  }, [supabase, expenseId]);

  if (items === null) {
    return (
      <div className="py-1 pl-6 text-xs" style={{ color: colors.textMuted }}>
        Carregando itens…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-1 pl-6 text-xs" style={{ color: colors.textMuted }}>
        Esse lançamento não tem itens.
      </div>
    );
  }

  return (
    <div className="space-y-1 py-1 pl-6">
      {items.map((item) => {
        const quantidade = quantidadeLabel(Number(item.quantity), item.unit);
        return (
          <div key={item.id} className="flex items-center gap-2">
            <span
              className="h-1 w-1 shrink-0 rounded-full opacity-60"
              style={{ backgroundColor: color }}
            />
            <span className="min-w-0 flex-1 truncate text-xs" style={{ color: colors.text }}>
              {item.description}
            </span>
            {!!quantidade && (
              <span className="shrink-0 text-[11px]" style={{ color: colors.textMuted }}>
                {quantidade}
              </span>
            )}
            <span className="shrink-0 text-xs font-semibold" style={{ color: colors.text }}>
              {formatBRL(Number(item.total))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
