'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { hexWithAlpha } from '../../../src/components/CategoryIcon';
import { Modal } from '../../../src/components/Modal';
import { ReportExportModal } from '../../../src/components/ReportExportModal';
import { useAuth } from '../../../src/context/AuthContext';
import { CONTACT_EMAIL, FEEDBACK_FORM_URL } from '../../../src/legal/content';
import { ThemePreference, useTheme } from '../../../src/theme/ThemeContext';

const APP_VERSION = '1.0.0';

export default function AjustesPage() {
  const { colors, preference, setPreference } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const avatar = meta.avatar_url ?? meta.picture;
  const name = meta.full_name ?? meta.name;
  const canDelete = confirmText.trim().toLowerCase() === 'excluir';

  const themeOptions: { key: ThemePreference; label: string; icon: string }[] = [
    { key: 'light', label: 'Claro', icon: 'white-balance-sunny' },
    { key: 'dark', label: 'Escuro', icon: 'weather-night' },
    { key: 'system', label: 'Sistema', icon: 'laptop' },
  ];

  async function runDelete() {
    setDeleting(true);
    const { error: err } = await deleteAccount();
    setDeleting(false);
    if (err) {
      setError(err);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold" style={{ color: colors.text }}>Ajustes</h1>

      {/* Aparência */}
      <Section colors={colors} label="APARÊNCIA">
        <div className="flex gap-3">
          {themeOptions.map((opt) => {
            const active = preference === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setPreference(opt.key)}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl border-2 py-4 transition"
                style={{
                  backgroundColor: active ? hexWithAlpha(colors.primary, 0.14) : colors.surface,
                  borderColor: active ? colors.primary : 'transparent',
                  color: active ? colors.primary : colors.textMuted,
                }}
              >
                <AppIcon icon={opt.icon} size={24} color={active ? colors.primary : colors.textMuted} />
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Conta */}
      <Section colors={colors} label="CONTA">
        <div className="flex items-center gap-3">
          {avatar ? (
            <Image src={avatar} alt="" width={44} height={44} className="rounded-full" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }}>
              <AppIcon icon="account" size={22} color={colors.primary} />
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold" style={{ color: colors.text }}>{name ?? user?.email}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>{name ? user?.email : 'Sincronizado na nuvem'}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition hover:opacity-80"
          style={{ backgroundColor: colors.surface, color: colors.text }}
        >
          <AppIcon icon="logout" size={20} color={colors.text} /> Sair
        </button>
      </Section>

      {/* Relatórios */}
      <Section colors={colors} label="RELATÓRIOS">
        <button
          onClick={() => setReportOpen(true)}
          className="flex w-full items-center gap-3 text-left transition hover:opacity-80"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: colors.primarySoft }}>
            <AppIcon icon="file-excel" size={22} color={colors.primary} />
          </div>
          <div className="flex-1">
            <div className="font-semibold" style={{ color: colors.text }}>Exportar para Excel</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Relatório mensal ou anual no seu e-mail</div>
          </div>
          <AppIcon icon="chevron-right" size={20} color={colors.textMuted} />
        </button>
      </Section>

      {/* Sobre */}
      <Section colors={colors} label="SOBRE">
        <Row colors={colors} icon="message-text-outline" label="Reclamar, pedir feature ou tirar dúvida" href={FEEDBACK_FORM_URL} external />
        <Divider colors={colors} />
        <CopyEmailRow colors={colors} email={CONTACT_EMAIL} />
        <Divider colors={colors} />
        <Row colors={colors} icon="shield-lock-outline" label="Política de Privacidade" href="/legal/privacy" />
        <Divider colors={colors} />
        <Row colors={colors} icon="file-document-outline" label="Termos de Uso" href="/legal/terms" />
        <Divider colors={colors} />
        <div className="flex items-center gap-3 py-3">
          <AppIcon icon="information-outline" size={20} color={colors.textMuted} />
          <span className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>Versão</span>
          <span className="text-sm" style={{ color: colors.textMuted }}>{APP_VERSION}</span>
        </div>
      </Section>

      {/* Zona de perigo */}
      <Section colors={colors} label="ZONA DE PERIGO">
        <button
          onClick={() => { setConfirmText(''); setError(null); setConfirmOpen(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition hover:opacity-80"
          style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
        >
          <AppIcon icon="account-remove" size={20} color={colors.danger} /> Excluir conta
        </button>
        <p className="mt-3 text-center text-sm" style={{ color: colors.textMuted }}>
          Apaga permanentemente sua conta e todos os dados (gastos, categorias e limites).
        </p>
        {error && <p className="mt-2 text-center text-sm" style={{ color: colors.danger }}>{error}</p>}
      </Section>

      <p className="mt-8 text-center text-sm" style={{ color: colors.textMuted }}>
        Meus Gastos · feito no Brasil
      </p>

      <Modal open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)} title="Excluir conta" maxWidth={420}>
        <p className="mb-4 leading-relaxed" style={{ color: colors.textMuted }}>
          Isso apaga <b>para sempre</b> seus gastos, categorias e limites. Para confirmar, digite{' '}
          <b style={{ color: colors.danger }}>excluir</b> abaixo.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="excluir"
          className="mb-4 w-full rounded-xl border-2 px-4 py-3 text-center outline-none"
          style={{ backgroundColor: colors.surface, borderColor: canDelete ? colors.danger : colors.border, color: colors.text }}
        />
        <button
          onClick={runDelete}
          disabled={!canDelete || deleting}
          className="w-full rounded-xl py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.danger, color: '#fff' }}
        >
          {deleting ? 'Excluindo…' : 'Excluir minha conta'}
        </button>
      </Modal>

      <ReportExportModal open={reportOpen} onClose={() => setReportOpen(false)} userEmail={user?.email} />
    </div>
  );
}

function Section({ colors, label, children }: { colors: any; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 ml-1 text-xs font-bold tracking-wide" style={{ color: colors.textMuted }}>{label}</div>
      <div className="rounded-2xl p-4" style={{ backgroundColor: colors.card }}>{children}</div>
    </div>
  );
}

function Row({ colors, icon, label, href, external }: { colors: any; icon: string; label: string; href: string; external?: boolean }) {
  const content = (
    <div className="flex items-center gap-3 py-3">
      <AppIcon icon={icon} size={20} color={colors.textMuted} />
      <span className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>{label}</span>
      <AppIcon icon={external ? 'open-in-new' : 'chevron-right'} size={18} color={colors.textMuted} />
    </div>
  );
  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return <Link href={href}>{content}</Link>;
}

function CopyEmailRow({ colors, email }: { colors: any; email: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button onClick={copy} className="flex w-full items-center gap-3 py-3 text-left" title={email}>
      <AppIcon icon={copied ? 'check-circle' : 'email-outline'} size={20} color={copied ? colors.primary : colors.textMuted} />
      <span className="flex-1 text-sm font-semibold transition-colors" style={{ color: copied ? colors.primary : colors.text }}>
        {copied ? 'E-mail copiado!' : 'Falar com a gente'}
      </span>
      <span className="inline-block transition-transform duration-200" style={{ transform: copied ? 'scale(1.2)' : 'scale(1)' }}>
        <AppIcon icon={copied ? 'check' : 'content-copy'} size={18} color={copied ? colors.primary : colors.textMuted} />
      </span>
    </button>
  );
}

function Divider({ colors }: { colors: any }) {
  return <div className="h-px" style={{ backgroundColor: colors.border }} />;
}
