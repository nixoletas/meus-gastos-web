'use client';

import Link from 'next/link';
import { useLedger } from '../context/LedgerContext';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';

/**
 * Faixa de "você está no caderno de outra pessoa".
 *
 * Sem ela, um gasto lançado no caderno errado é indistinguível de um lançado no
 * próprio — o app inteiro tem exatamente a mesma cara nos dois casos.
 */
export function SharedLedgerBanner() {
  const { colors } = useTheme();
  const t = useT();
  const { isShared, activeLedger, role, revokedNotice, clearRevokedNotice } = useLedger();

  if (revokedNotice !== null) {
    return (
      <button
        onClick={clearRevokedNotice}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold"
        style={{ backgroundColor: hexWithAlpha(colors.warning, 0.16), color: colors.text }}
      >
        <AppIcon icon="account-remove" size={16} color={colors.warning} />
        <span className="flex-1">{t.sharing.revokedNotice(revokedNotice)}</span>
        <AppIcon icon="close" size={16} color={colors.textMuted} />
      </button>
    );
  }

  if (!isShared || !activeLedger) return null;

  const nome = activeLedger.ownerName || activeLedger.ownerEmail;

  return (
    <Link
      href="/familia"
      className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold transition hover:opacity-90"
      style={{ backgroundColor: hexWithAlpha(colors.primary, 0.14), color: colors.text }}
    >
      <AppIcon icon="eye-outline" size={16} color={colors.primary} />
      <span className="flex-1 truncate">
        {t.sharing.viewingBanner(nome)}
        {role === 'viewer' ? ` · ${t.sharing.readOnlyBadge}` : ''}
      </span>
      <AppIcon icon="swap-horizontal" size={16} color={colors.primary} />
    </Link>
  );
}
