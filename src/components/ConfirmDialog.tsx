'use client';

import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  title: string;
  /** Texto explicando a consequência da ação. */
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  /** `danger` para ações destrutivas (padrão), `primary` para as demais. */
  tone?: 'danger' | 'primary';
  icon?: string;
  /** Trava os botões enquanto a ação roda. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmação do app, no lugar do `confirm()` nativo do navegador. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busyLabel,
  tone = 'danger',
  icon = 'trash-can-outline',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const t = useT();
  const confirmText = confirmLabel ?? t.confirm.defaultConfirm;
  const cancelText = cancelLabel ?? t.confirm.defaultCancel;
  const busyText = busyLabel ?? t.web.deletingShort;
  const accent = tone === 'danger' ? colors.danger : colors.primary;
  const accentSoft = tone === 'danger' ? colors.dangerSoft : colors.primarySoft;

  return (
    <Modal open={open} onClose={() => !busy && onCancel()} maxWidth={400}>
      <div className="flex flex-col items-center text-center">
        <span className="relative mb-4 flex h-16 w-16 items-center justify-center">
          <span
            className="mg-ring absolute inset-0 rounded-full"
            style={{ backgroundColor: hexWithAlpha(accent, 0.35) }}
          />
          <span
            className="mg-pop relative flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: accentSoft }}
          >
            <AppIcon icon={icon} size={30} color={accent} />
          </span>
        </span>

        <h2 className="text-lg font-extrabold" style={{ color: colors.text }}>
          {title}
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: colors.textMuted }}>
          {message}
        </p>

        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl px-4 py-3 font-bold transition hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: colors.surface, color: colors.text }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl px-4 py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accent, color: '#FFFFFF' }}
          >
            {busy ? busyText : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
