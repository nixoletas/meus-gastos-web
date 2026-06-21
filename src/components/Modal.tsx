'use client';

import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
};

export function Modal({ open, onClose, title, children, maxWidth = 480 }: Props) {
  const { colors } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-3xl p-6 shadow-2xl"
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
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
