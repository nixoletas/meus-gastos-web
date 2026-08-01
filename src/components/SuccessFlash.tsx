'use client';

import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';

/** Duração total da animação (entra, segura, sai) — casada com `.mg-flash` no CSS. */
const DURATION = 1700;

type Props = {
  /** Ex.: "R$ 42,90 lançado". */
  message: string;
  onDone: () => void;
};

/**
 * Confirmação rápida de que a ação deu certo, sem tirar o foco do formulário.
 * Remonte com `key` diferente para reexibir.
 */
export function SuccessFlash({ message, onDone }: Props) {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = window.setTimeout(onDone, DURATION);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mg-flash pointer-events-none fixed bottom-8 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-4 py-3 shadow-2xl"
      style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        <span
          className="mg-ring absolute inset-0 rounded-full"
          style={{ backgroundColor: colors.success }}
        />
        <span
          className="mg-pop relative flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.success }}
        >
          <svg
            className="mg-check"
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4.5 12.5l5 5 10-10" />
          </svg>
        </span>
      </span>
      <span className="text-sm font-bold" style={{ color: colors.text }}>
        {message}
      </span>
    </div>
  );
}
