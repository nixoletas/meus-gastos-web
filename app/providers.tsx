'use client';

import { AuthProvider } from '../src/context/AuthContext';
import { DataProvider } from '../src/context/DataContext';
import { I18nProvider } from '../src/i18n';
import { Lang } from '../src/i18n/active';
import { ThemeProvider } from '../src/theme/ThemeContext';

export function Providers({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider initialLang={lang}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
