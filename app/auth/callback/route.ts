import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

/** Troca o "code" do OAuth do Google por uma sessão (cookies). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Convite da família feito para este e-mail: vincula antes do primeiro
      // render, para o caderno compartilhado já aparecer na lista. A RPC é
      // idempotente — o LedgerContext chama de novo no cliente.
      await supabase.rpc('claim_household_invites');
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
