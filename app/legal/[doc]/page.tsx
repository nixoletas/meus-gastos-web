'use client';

import Link from 'next/link';
import { use } from 'react';
import {
  CONTACT_EMAIL,
  LAST_UPDATED,
  PRIVACY,
  TERMS,
} from '../../../src/legal/content';
import { useTheme } from '../../../src/theme/ThemeContext';

export default function LegalPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = use(params);
  const { colors } = useTheme();
  const isPrivacy = doc === 'privacy' || doc === 'privacidade';
  const sections = isPrivacy ? PRIVACY : TERMS;
  const title = isPrivacy ? 'Política de Privacidade' : 'Termos de Uso';

  return (
    <main className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/login"
          className="text-sm font-bold"
          style={{ color: colors.primary }}
        >
          ← Voltar
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold" style={{ color: colors.text }}>
          {title}
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Última atualização: {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold" style={{ color: colors.text }}>
                {s.title}
              </h2>
              <div className="mt-2 space-y-2">
                {s.body.map((p, i) => (
                  <p key={i} className="leading-relaxed" style={{ color: colors.textMuted }}>
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm" style={{ color: colors.textMuted }}>
          Contato: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: colors.primary }}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </main>
  );
}
