'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useLedger } from '../context/LedgerContext';
import { useI18n } from '../i18n';
import { monthName } from '../utils/date';
import { useTheme } from '../theme/ThemeContext';
import { hexWithAlpha } from './CategoryIcon';
import { AppIcon } from './AppIcon';
import { Modal } from './Modal';

type Kind = 'month' | 'year';

type Props = {
  open: boolean;
  onClose: () => void;
  userEmail?: string | null;
};

type ReportResult = {
  ok: boolean;
  filename: string;
  total: number;
  count: number;
  xlsxBase64: string;
  error?: string;
};

export function ReportExportModal({ open, onClose, userEmail }: Props) {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  // Exporta o caderno que está aberto, não a união dos compartilhados.
  const { ownerId } = useLedger();
  const now = new Date();
  const [kind, setKind] = useState<Kind>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [busy, setBusy] = useState<null | 'email' | 'download'>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const label =
    kind === 'year'
      ? String(year)
      : lang === 'en'
        ? `${monthName(month)} ${year}`
        : `${monthName(month)} de ${year}`;

  function shift(delta: number) {
    setFeedback(null);
    if (kind === 'year') { setYear((y) => y + delta); return; }
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  async function generate(send: boolean): Promise<ReportResult | null> {
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke<ReportResult>('export-report', {
      body: { period: kind, year, month: month + 1, send, lang, owner_id: ownerId },
    });
    if (error) {
      let msg = error.message;
      try {
        const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
        if (ctx?.json) { const b = await ctx.json(); msg = b?.error ?? msg; }
      } catch { /* ignore */ }
      setFeedback({ kind: 'err', text: msg ?? t.report.genericError });
      return null;
    }
    if (!data?.ok) {
      setFeedback({ kind: 'err', text: data?.error ?? t.report.genericError });
      return null;
    }
    if (data.count === 0) {
      setFeedback({ kind: 'err', text: t.report.noExpenses(label) });
      return null;
    }
    return data;
  }

  async function handleEmail() {
    setFeedback(null);
    setBusy('email');
    const res = await generate(true);
    setBusy(null);
    if (res) {
      setFeedback({
        kind: 'ok',
        text: t.web.reportSent(label, userEmail ?? t.report.yourEmail),
      });
    }
  }

  async function handleDownload() {
    setFeedback(null);
    setBusy('download');
    const res = await generate(false);
    if (res) {
      try {
        const bytes = Uint8Array.from(atob(res.xlsxBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setFeedback({ kind: 'err', text: t.web.downloadFailed });
      }
    }
    setBusy(null);
  }

  const kindOptions: { key: Kind; label: string; icon: string }[] = [
    { key: 'month', label: t.report.monthly, icon: 'calendar-month' },
    { key: 'year', label: t.report.yearly, icon: 'calendar-blank-multiple' },
  ];

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={t.report.title} maxWidth={420}>
      <p className="mb-5 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
        {t.web.reportSubtitle}
      </p>

      {/* Tipo */}
      <div className="mb-3 flex gap-3">
        {kindOptions.map((opt) => {
          const active = kind === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => { setKind(opt.key); setFeedback(null); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 font-bold transition"
              style={{
                backgroundColor: active ? hexWithAlpha(colors.primary, 0.14) : colors.surface,
                borderColor: active ? colors.primary : 'transparent',
                color: active ? colors.primary : colors.textMuted,
              }}
            >
              <AppIcon icon={opt.icon} size={20} color={active ? colors.primary : colors.textMuted} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Período */}
      <div
        className="mb-5 flex items-center justify-between rounded-xl px-2"
        style={{ backgroundColor: colors.surface, height: 52 }}
      >
        <button onClick={() => shift(-1)} className="rounded-lg p-2 transition hover:opacity-70" aria-label={t.web.previous}>
          <AppIcon icon="chevron-left" size={24} color={colors.text} />
        </button>
        <span className="font-bold" style={{ color: colors.text }}>{label}</span>
        <button onClick={() => shift(1)} className="rounded-lg p-2 transition hover:opacity-70" aria-label={t.web.next}>
          <AppIcon icon="chevron-right" size={24} color={colors.text} />
        </button>
      </div>

      {feedback && (
        <p
          className="mb-4 rounded-xl px-4 py-3 text-center text-sm font-semibold"
          style={{
            backgroundColor: feedback.kind === 'ok' ? hexWithAlpha(colors.primary, 0.12) : colors.dangerSoft,
            color: feedback.kind === 'ok' ? colors.primary : colors.danger,
          }}
        >
          {feedback.text}
        </p>
      )}

      <button
        onClick={handleEmail}
        disabled={!!busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
      >
        <AppIcon icon="email-fast" size={20} color={colors.onPrimary} />
        {busy === 'email' ? t.web.sending : t.report.sendEmail}
      </button>

      <button
        onClick={handleDownload}
        disabled={!!busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: colors.surface, color: colors.text }}
      >
        <AppIcon icon="download" size={20} color={colors.text} />
        {busy === 'download' ? t.web.generating : t.web.downloadSheet}
      </button>
    </Modal>
  );
}
