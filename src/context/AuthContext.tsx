'use client';

import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createClient } from '../../lib/supabase/client';
import { clearActiveLedger } from '../lib/activeLedger';
import { tNow } from '../i18n';

type AuthResult = { error: string | null };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Traduz mensagens comuns de erro do Supabase para o idioma ativo. */
function traduzErro(message: string): string {
  const m = message.toLowerCase();
  const erros = tNow().errors;
  if (m.includes('network')) return erros.noConnection;
  if (m.includes('rate limit') || m.includes('too many')) return erros.rateLimit;
  return message;
}

export function AuthProvider({
  initialSession = null,
  children,
}: {
  initialSession?: Session | null;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signInWithGoogle = async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    return { error: error ? traduzErro(error.message) : null };
  };

  const signOut = async () => {
    // Quem entrar depois começa no próprio caderno.
    clearActiveLedger();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const deleteAccount = async (): Promise<AuthResult> => {
    const { error } = await supabase.rpc('delete_account');
    if (error) return { error: traduzErro(error.message) };
    clearActiveLedger();
    await supabase.auth.signOut();
    window.location.href = '/login';
    return { error: null };
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithGoogle,
      signOut,
      deleteAccount,
    }),
    [session, loading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
}
