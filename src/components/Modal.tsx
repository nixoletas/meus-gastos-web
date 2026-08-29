'use client';

import { useEffect, useRef } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

/** Modais abertos, do mais antigo ao mais recente: só o do topo responde ao Esc. */
const openStack: symbol[] = [];

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
  /**
   * Painel exibido ao lado do modal em telas largas (ex.: calendário).
   * Fica fora do card para não aumentar a altura nem forçar rolagem.
   */
  sidePanel?: React.ReactNode;
};

export function Modal({ open, onClose, title, children, maxWidth = 480, sidePanel }: Props) {
  const { colors } = useTheme();
  const t = useT();

  // Ref evita reentrar na pilha a cada render quando onClose é uma arrow inline.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const id = Symbol('modal');
    openStack.push(id);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openStack[openStack.length - 1] !== id) return;
      onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      const index = openStack.indexOf(id);
      if (index !== -1) openStack.splice(index, 1);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="mg-overlay-in fixed inset-0 z-50 flex items-center justify-center gap-4 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="mg-dialog-in max-h-[90vh] w-full overflow-y-auto rounded-3xl p-6 shadow-2xl"
        style={{ backgroundColor: colors.card, maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold" style={{ color: colors.text }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:opacity-70"
              style={{ color: colors.textMuted, backgroundColor: colors.surface }}
              aria-label={t.common.close}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>

      {sidePanel && (
        <div
          className="hidden max-h-[90vh] w-80 shrink-0 overflow-y-auto lg:block"
          onClick={(e) => e.stopPropagation()}
        >
          {sidePanel}
        </div>
      )}
    </div>
  );
}
