import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from './providers';
import { LANG_COOKIE, normalizeLang } from '../src/i18n/active';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Meus Gastos',
  description: 'Controle de gastos pessoais — versão web. / Personal expense tracking — web version.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // O idioma vem do cookie para o HTML do servidor já sair certo; sem cookie,
  // o provider ajusta pelo navegador depois da hidratação.
  const lang = normalizeLang((await cookies()).get(LANG_COOKIE)?.value) ?? 'pt-BR';

  return (
    <html lang={lang} className={spaceGrotesk.variable} suppressHydrationWarning>
      <body>
        <Providers lang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
