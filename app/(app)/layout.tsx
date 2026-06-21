'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AppIcon } from '../../src/components/AppIcon';
import { hexWithAlpha } from '../../src/components/CategoryIcon';
import { ExpenseModal } from '../../src/components/ExpenseModal';
import { PiggyMark } from '../../src/components/Mascot';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme/ThemeContext';

const NAV = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/categorias', label: 'Categorias', icon: 'shape' },
  { href: '/limites', label: 'Limites', icon: 'target' },
  { href: '/graficos', label: 'Gráficos', icon: 'chart-donut' },
  { href: '/ajustes', label: 'Ajustes', icon: 'cog' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [newOpen, setNewOpen] = useState(false);

  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const avatar = meta.avatar_url ?? meta.picture;
  const displayName = meta.full_name ?? meta.name ?? user?.email ?? '';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: colors.background }}>
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ color: colors.primary }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Sidebar */}
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-4 md:flex"
        style={{ backgroundColor: colors.card, borderRight: `1px solid ${colors.border}` }}
      >
        <div className="mb-6 flex items-center gap-2 px-2 pt-2 text-lg font-extrabold" style={{ color: colors.text }}>
          <PiggyMark size={28} /> Meus Gastos
        </div>

        <button
          onClick={() => setNewOpen(true)}
          className="mb-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition hover:opacity-90"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          <AppIcon icon="plus" size={20} color={colors.onPrimary} /> Novo gasto
        </button>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                style={{
                  backgroundColor: active ? hexWithAlpha(colors.primary, 0.14) : 'transparent',
                  color: active ? colors.primary : colors.textMuted,
                }}
              >
                <AppIcon icon={item.icon} size={20} color={active ? colors.primary : colors.textMuted} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/ajustes"
          className="mt-2 flex items-center gap-3 rounded-xl p-2 transition hover:opacity-80"
          style={{ backgroundColor: colors.surface }}
        >
          {avatar ? (
            <Image src={avatar} alt="" width={36} height={36} className="rounded-full" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }}>
              <AppIcon icon="account" size={20} color={colors.primary} />
            </div>
          )}
          <span className="truncate text-sm font-semibold" style={{ color: colors.text }}>
            {displayName}
          </span>
        </Link>
      </aside>

      {/* Conteúdo */}
      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top bar mobile */}
        <div
          className="flex items-center justify-between p-4 md:hidden"
          style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}` }}
        >
          <span className="flex items-center gap-2 font-extrabold" style={{ color: colors.text }}>
            <PiggyMark size={24} /> Meus Gastos
          </span>
          <button
            onClick={() => setNewOpen(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-bold"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            + Novo
          </button>
        </div>

        <div className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-10">{children}</div>

        {/* Nav inferior mobile */}
        <nav
          className="sticky bottom-0 flex justify-around p-2 md:hidden"
          style={{ backgroundColor: colors.card, borderTop: `1px solid ${colors.border}` }}
        >
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-1">
                <AppIcon icon={item.icon} size={22} color={active ? colors.primary : colors.textMuted} />
                <span className="text-[10px] font-semibold" style={{ color: active ? colors.primary : colors.textMuted }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </main>

      <ExpenseModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
