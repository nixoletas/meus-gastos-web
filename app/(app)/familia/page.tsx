'use client';

import { useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { hexWithAlpha } from '../../../src/components/CategoryIcon';
import { ConfirmDialog } from '../../../src/components/ConfirmDialog';
import { Ledger, useLedger } from '../../../src/context/LedgerContext';
import { useT } from '../../../src/i18n';
import { useTheme } from '../../../src/theme/ThemeContext';
import { HouseholdMember } from '../../../src/types';

/** Como a pessoa aparece na lista: nome do Google quando já entrou, senão o e-mail. */
function memberLabel(m: HouseholdMember): string {
  return m.member_name || m.invited_email;
}

function ledgerLabel(l: Ledger, meuCaderno: string): string {
  if (l.role === 'owner') return meuCaderno;
  return l.ownerName || l.ownerEmail;
}

export default function FamiliaPage() {
  const { colors } = useTheme();
  const t = useT();
  const {
    ledgers,
    members,
    ownerId,
    loading,
    invite,
    changeRole,
    revoke,
    leave,
    setActiveLedger,
  } = useLedger();

  const [email, setEmail] = useState('');
  const [novoPapel, setNovoPapel] = useState<'viewer' | 'editor'>('viewer');
  const [convidando, setConvidando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aRemover, setARemover] = useState<HouseholdMember | null>(null);
  const [aSair, setASair] = useState<Ledger | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const compartilhados = ledgers.filter((l) => l.role !== 'owner');

  /** A mensagem vem do SQLSTATE traduzido pelo LedgerContext. */
  const mensagemDeErro = (chave: string) =>
    (t.sharing.errors as Record<string, string>)[chave] ?? t.sharing.errors.generic;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const valor = email.trim();
    if (!valor || convidando) return;
    setConvidando(true);
    setErro(null);
    const { error } = await invite(valor, novoPapel);
    setConvidando(false);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setEmail('');
    setNovoPapel('viewer');
  }

  async function handleRevoke() {
    if (!aRemover) return;
    setOcupado(true);
    await revoke(aRemover.id);
    setOcupado(false);
    setARemover(null);
  }

  async function handleLeave() {
    if (!aSair) return;
    setOcupado(true);
    await leave(aSair.ownerId);
    setOcupado(false);
    setASair(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold" style={{ color: colors.text }}>
        {t.sharing.title}
      </h1>

      {/* Cadernos que posso abrir. Com um caderno só, a lista seria ruído. */}
      {compartilhados.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 ml-1 text-xs font-bold tracking-wide" style={{ color: colors.textMuted }}>
            {t.sharing.myLedgers}
          </div>
          <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
            {ledgers.map((l, index) => {
              const aberto = l.ownerId === ownerId;
              return (
                <div
                  key={l.ownerId}
                  className="flex items-center gap-3 px-4 py-3"
                  style={index > 0 ? { borderTop: `1px solid ${colors.border}` } : undefined}
                >
                  <button
                    onClick={() => setActiveLedger(l.ownerId)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <AppIcon
                      icon={aberto ? 'checkbox-marked-circle' : 'circle-outline'}
                      size={22}
                      color={aberto ? colors.primary : colors.textMuted}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold" style={{ color: colors.text }}>
                        {ledgerLabel(l, t.sharing.myLedger)}
                      </span>
                      <span className="block truncate text-xs" style={{ color: colors.textMuted }}>
                        {l.role === 'owner'
                          ? t.sharing.roleOwner
                          : l.role === 'editor'
                            ? t.sharing.roleEditor
                            : t.sharing.roleViewer}
                        {aberto ? ` · ${t.sharing.active}` : ''}
                      </span>
                    </span>
                  </button>
                  {l.role !== 'owner' && (
                    <button onClick={() => setASair(l)} title={t.sharing.leave} className="p-1">
                      <AppIcon icon="logout" size={20} color={colors.danger} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quem eu convidei para o meu caderno. */}
      <section className="mb-6">
        <div className="mb-2 ml-1 text-xs font-bold tracking-wide" style={{ color: colors.textMuted }}>
          {t.sharing.whoSees}
        </div>

        <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: colors.card }}>
          {members.length === 0 ? (
            <div className="p-5 text-center text-sm" style={{ color: colors.textMuted }}>
              {loading ? '…' : t.sharing.emptyMembers}
            </div>
          ) : (
            members.map((m, index) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3"
                style={index > 0 ? { borderTop: `1px solid ${colors.border}` } : undefined}
              >
                <AppIcon
                  icon={m.status === 'pending' ? 'email-outline' : 'account'}
                  size={22}
                  color={colors.textMuted}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold" style={{ color: colors.text }}>
                    {memberLabel(m)}
                  </span>
                  <span className="block truncate text-xs" style={{ color: colors.textMuted }}>
                    {m.status === 'pending' ? `${t.sharing.pending} · ` : ''}
                    {m.invited_email}
                  </span>
                </span>

                {/* Um clique alterna entre só leitura e edição. */}
                <button
                  onClick={() => changeRole(m.id, m.role === 'editor' ? 'viewer' : 'editor')}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-80"
                  style={{
                    backgroundColor:
                      m.role === 'editor' ? hexWithAlpha(colors.primary, 0.16) : colors.surface,
                    color: m.role === 'editor' ? colors.primary : colors.textMuted,
                  }}
                >
                  {m.role === 'editor' ? t.sharing.roleEditor : t.sharing.roleViewer}
                </button>

                <button onClick={() => setARemover(m)} title={t.sharing.revoke} className="p-1">
                  <AppIcon icon="trash-can-outline" size={20} color={colors.danger} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Convite novo. */}
      <form onSubmit={handleInvite} className="rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
        <label className="mb-1 block text-sm font-semibold" style={{ color: colors.text }}>
          {t.sharing.inviteEmailLabel}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErro(null);
          }}
          placeholder={t.sharing.inviteEmailPlaceholder}
          autoComplete="off"
          className="mb-3 w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        />

        <div className="mb-1 text-sm font-semibold" style={{ color: colors.text }}>
          {t.sharing.invitePermission}
        </div>
        <div className="mb-3 flex gap-2">
          {(['viewer', 'editor'] as const).map((papel) => {
            const ativo = novoPapel === papel;
            return (
              <button
                key={papel}
                type="button"
                onClick={() => setNovoPapel(papel)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition"
                style={{
                  backgroundColor: ativo ? colors.primary : colors.surface,
                  color: ativo ? colors.onPrimary : colors.textMuted,
                  border: `1px solid ${ativo ? colors.primary : colors.border}`,
                }}
              >
                {papel === 'editor' ? t.sharing.roleEditor : t.sharing.roleViewer}
              </button>
            );
          })}
        </div>

        {!!erro && (
          <div className="mb-2 text-sm font-semibold" style={{ color: colors.danger }}>
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={!email.trim() || convidando}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition hover:opacity-90 disabled:cursor-not-allowed"
          style={{
            backgroundColor: email.trim() ? colors.primary : colors.surface,
            color: email.trim() ? colors.onPrimary : colors.textMuted,
          }}
        >
          <AppIcon
            icon="plus-circle"
            size={18}
            color={email.trim() ? colors.onPrimary : colors.textMuted}
          />
          {convidando ? t.sharing.inviting : t.sharing.inviteButton}
        </button>

        <p className="mt-3 text-xs leading-relaxed" style={{ color: colors.textMuted }}>
          {t.sharing.inviteHint}
        </p>
      </form>

      <ConfirmDialog
        open={aRemover !== null}
        title={t.sharing.revokeConfirmTitle}
        message={aRemover ? t.sharing.revokeConfirmBody(memberLabel(aRemover)) : ''}
        confirmLabel={t.sharing.revoke}
        busy={ocupado}
        icon="account-remove"
        onConfirm={handleRevoke}
        onCancel={() => setARemover(null)}
      />

      <ConfirmDialog
        open={aSair !== null}
        title={t.sharing.leaveConfirmTitle}
        message={aSair ? t.sharing.leaveConfirmBody(ledgerLabel(aSair, t.sharing.myLedger)) : ''}
        confirmLabel={t.sharing.leave}
        busy={ocupado}
        icon="logout"
        onConfirm={handleLeave}
        onCancel={() => setASair(null)}
      />
    </div>
  );
}
