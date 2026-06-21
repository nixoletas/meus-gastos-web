'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GoogleIcon } from '../../src/components/GoogleIcon';
import { Mascot } from '../../src/components/Mascot';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme/ThemeContext';

export default function LoginPage() {
  const { colors } = useTheme();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err);
      setLoading(false);
    }
    // Em sucesso, o browser redireciona pro Google.
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ backgroundColor: colors.background }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center shadow-xl"
        style={{ backgroundColor: colors.card }}
      >
        <div className="mb-4 flex justify-center">
          <Mascot size={120} />
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: colors.text }}>
          Meus Gastos
        </h1>
        <p className="mt-1 font-bold" style={{ color: colors.primary }}>
          Pra onde vai cada centavo.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border font-bold transition hover:opacity-90 disabled:opacity-60"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          }}
        >
          {loading ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              style={{ color: colors.primary }}
            />
          ) : (
            <>
              <GoogleIcon size={22} />
              Continuar com Google
            </>
          )}
        </button>

        {error && (
          <p className="mt-4 text-sm" style={{ color: colors.danger }}>
            {error}
          </p>
        )}

        <p className="mt-6 text-xs leading-5" style={{ color: colors.textMuted }}>
          Ao continuar, você concorda com os{' '}
          <Link href="/legal/terms" className="font-bold" style={{ color: colors.primary }}>
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link href="/legal/privacy" className="font-bold" style={{ color: colors.primary }}>
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
