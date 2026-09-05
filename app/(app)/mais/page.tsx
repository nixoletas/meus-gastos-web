'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { ReportExportModal } from '../../../src/components/ReportExportModal';
import { useAuth } from '../../../src/context/AuthContext';
import { useLedger } from '../../../src/context/LedgerContext';
import { useT } from '../../../src/i18n';
import { useTheme } from '../../../src/theme/ThemeContext';

/**
 * Porta de entrada das features que não cabem na navegação — família e
 * relatórios. Ajustes fica no fim porque é configuração, não uso do dia.
 */
export default function MaisPage() {
  const { colors } = useTheme();
  const t = useT();
  const { user } = useAuth();
  const { members, isShared, activeLedger } = useLedger();
  const [reportOpen, setReportOpen] = useState(false);

  // Resumo da linha de Família: de quem é o caderno aberto ou quantas pessoas
  // acompanham o meu.
  const ativos = members.filter((m) => m.status === 'active').length;
  const resumoFamilia = isShared
    ? t.sharing.subtitleViewing(activeLedger?.ownerName || activeLedger?.ownerEmail || '')
    : ativos === 0
      ? t.sharing.subtitleNobody
      : t.sharing.subtitleCount(ativos);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold" style={{ color: colors.text }}>
        {t.tabs.more}
      </h1>

      <div className="rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
        <Link href="/familia" className="flex w-full items-center gap-3 text-left transition hover:opacity-80">
          <RowIcon icon="account-group" colors={colors} />
          <div className="flex-1">
            <div className="font-semibold" style={{ color: colors.text }}>
              {t.tabs.family}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {resumoFamilia}
            </div>
          </div>
          <AppIcon icon="chevron-right" size={20} color={colors.textMuted} />
        </Link>

        <div className="my-3 ml-14 h-px" style={{ backgroundColor: colors.border }} />

        <button
          onClick={() => setReportOpen(true)}
          className="flex w-full items-center gap-3 text-left transition hover:opacity-80"
        >
          <RowIcon icon="file-excel" colors={colors} />
          <div className="flex-1">
            <div className="font-semibold" style={{ color: colors.text }}>
              {t.settings.exportExcel}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {t.settings.exportExcelSub}
            </div>
          </div>
          <AppIcon icon="chevron-right" size={20} color={colors.textMuted} />
        </button>
      </div>

      <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
        <Link href="/ajustes" className="flex w-full items-center gap-3 text-left transition hover:opacity-80">
          <RowIcon icon="cog" colors={colors} />
          <div className="flex-1 font-semibold" style={{ color: colors.text }}>
            {t.settings.title}
          </div>
          <AppIcon icon="chevron-right" size={20} color={colors.textMuted} />
        </Link>
      </div>

      <ReportExportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        userEmail={user?.email}
      />
    </div>
  );
}

function RowIcon({ icon, colors }: { icon: string; colors: any }) {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl"
      style={{ backgroundColor: colors.primarySoft }}
    >
      <AppIcon icon={icon} size={22} color={colors.primary} />
    </div>
  );
}
