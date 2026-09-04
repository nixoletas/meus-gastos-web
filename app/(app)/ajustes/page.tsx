'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { hexWithAlpha } from '../../../src/components/CategoryIcon';
import { Modal } from '../../../src/components/Modal';
import { ReportExportModal } from '../../../src/components/ReportExportModal';
import { useAuth } from '../../../src/context/AuthContext';
import { useLedger } from '../../../src/context/LedgerContext';
import { useI18n, useT } from '../../../src/i18n';
import { LANG_LABELS, LANGS } from '../../../src/i18n/active';
import { CONTACT_EMAIL, FEEDBACK_FORM_URL } from '../../../src/legal/content';
import { ThemePreference, useTheme } from '../../../src/theme/ThemeContext';

const APP_VERSION = '1.0.0';

export default function AjustesPage() {
  const { colors, preference, setPreference } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { user, signOut, deleteAccount } = useAuth();
  const { members, isShared, activeLedger } = useLedger();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const avatar = meta.avatar_url ?? meta.picture;
  const name = meta.full_name ?? meta.name;
  const canDelete = confirmText.trim().toLowerCase() === t.settings.deleteConfirmWord;

  // Resumo da linha de Família: de quem é o caderno aberto ou quantas pessoas
  // acompanham o meu.
  const ativos = members.filter((m) => m.status === 'active').length;
  const resumoFamilia = isShared
    ? t.sharing.subtitleViewing(activeLedger?.ownerName || activeLedger?.ownerEmail || '')
    : ativos === 0
      ? t.sharing.subtitleNobody
      : t.sharing.subtitleCount(ativos);

  const themeOptions: { key: ThemePreference; label: string; icon: string }[] = [
    { key: 'light', label: t.settings.themeLight, icon: 'white-balance-sunny' },
    { key: 'dark', label: t.settings.themeDark, icon: 'weather-night' },
    { key: 'system', label: t.settings.themeSystem, icon: 'laptop' },
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
      <h1 className="mb-6 text-2xl font-extrabold" style={{ color: colors.text }}>
        {t.settings.title}
      </h1>

      {/* Aparência */}
      <Section colors={colors} label={t.settings.appearance}>
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

      {/* Idioma */}
      <Section colors={colors} label={t.settings.language}>
        <div className="flex gap-3">
          {LANGS.map((code) => {
            const active = lang === code;
            return (
              <button
                key={code}
                onClick={() => setLang(code)}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl border-2 py-4 transition"
                style={{
                  backgroundColor: active
                    ? hexWithAlpha(colors.primary, 0.14)
                    : colors.surface,
                  borderColor: active ? colors.primary : 'transparent',
                  color: active ? colors.primary : colors.textMuted,
                }}
              >
                <AppIcon
                  icon={code === 'en' ? 'alphabetical-variant' : 'translate'}
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
                <span className="text-sm font-semibold">{LANG_LABELS[code]}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Conta */}
      <Section colors={colors} label={t.settings.account}>
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
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {name ? user?.email : t.settings.syncedInCloud}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition hover:opacity-80"
          style={{ backgroundColor: colors.surface, color: colors.text }}
        >
          <AppIcon icon="logout" size={20} color={colors.text} /> {t.settings.signOut}
        </button>
      </Section>

      {/* Família: quem mais acompanha estes gastos, e de quem eu acompanho. */}
      <Section colors={colors} label={t.sharing.section}>
        <Link href="/familia" className="flex w-full items-center gap-3 text-left transition hover:opacity-80">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: colors.primarySoft }}>
            <AppIcon icon="account-group" size={22} color={colors.primary} />
          </div>
          <div className="flex-1">
            <div className="font-semibold" style={{ color: colors.text }}>
              {t.sharing.title}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {resumoFamilia}
            </div>
          </div>
          <AppIcon icon="chevron-right" size={20} color={colors.textMuted} />
        </Link>
      </Section>

      {/* Relatórios */}
      <Section colors={colors} label={t.settings.reports}>
        <button
          onClick={() => setReportOpen(true)}
          className="flex w-full items-center gap-3 text-left transition hover:opacity-80"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: colors.primarySoft }}>
            <AppIcon icon="file-excel" size={22} color={colors.primary} />
          </div>
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
      </Section>

      {/* Sobre */}
      <Section colors={colors} label={t.settings.about}>
        <Row colors={colors} icon="message-text-outline" label={t.settings.feedback} href={FEEDBACK_FORM_URL} external />
        <Divider colors={colors} />
        <CopyEmailRow colors={colors} email={CONTACT_EMAIL} />
        <Divider colors={colors} />
        <Row colors={colors} icon="shield-lock-outline" label={t.settings.privacyPolicy} href="/legal/privacy" />
        <Divider colors={colors} />
        <Row colors={colors} icon="file-document-outline" label={t.settings.termsOfUse} href="/legal/terms" />
        <Divider colors={colors} />
        <div className="flex items-center gap-3 py-3">
          <AppIcon icon="information-outline" size={20} color={colors.textMuted} />
          <span className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>
            {t.settings.version}
          </span>
          <span className="text-sm" style={{ color: colors.textMuted }}>{APP_VERSION}</span>
        </div>
      </Section>

      {/* Zona de perigo */}
      <Section colors={colors} label={t.settings.dangerZone}>
        <button
          onClick={() => { setConfirmText(''); setError(null); setConfirmOpen(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition hover:opacity-80"
          style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
        >
          <AppIcon icon="account-remove" size={20} color={colors.danger} /> {t.settings.deleteAccount}
        </button>
        <p className="mt-3 text-center text-sm" style={{ color: colors.textMuted }}>
          {t.settings.deleteHint}
        </p>
        {error && <p className="mt-2 text-center text-sm" style={{ color: colors.danger }}>{error}</p>}
      </Section>

      <p className="mt-8 text-center text-sm" style={{ color: colors.textMuted }}>
        {t.web.footer}
      </p>

      <Modal open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)} title={t.web.deleteAccountTitle} maxWidth={420}>
        <p className="mb-4 leading-relaxed" style={{ color: colors.textMuted }}>
          {t.web.deleteAccountWarning} {t.settings.deleteConfirmPrefix}{' '}
          <b style={{ color: colors.danger }}>{t.settings.deleteConfirmWord}</b>
          {t.settings.deleteConfirmSuffix}
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={t.settings.deleteConfirmWord}
          className="mb-4 w-full rounded-xl border-2 px-4 py-3 text-center outline-none"
          style={{ backgroundColor: colors.surface, borderColor: canDelete ? colors.danger : colors.border, color: colors.text }}
        />
        <button
          onClick={runDelete}
          disabled={!canDelete || deleting}
          className="w-full rounded-xl py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.danger, color: '#fff' }}
        >
          {deleting ? t.web.deleting : t.web.deleteMyAccount}
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
  const t = useT();
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
      <span
        className="flex-1 text-sm font-semibold transition-colors"
        style={{ color: copied ? colors.primary : colors.text }}
      >
        {copied ? t.settings.emailCopied : t.settings.contactUs}
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
