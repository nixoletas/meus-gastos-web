'use client';

import { AuthProvider } from '../src/context/AuthContext';
import { DataProvider } from '../src/context/DataContext';
import { ThemeProvider } from '../src/theme/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
