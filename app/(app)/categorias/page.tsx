'use client';

import { useMemo, useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../../src/components/CategoryIcon';
import { CategoryModal } from '../../../src/components/CategoryModal';
import { useData } from '../../../src/context/DataContext';
import { useLedger } from '../../../src/context/LedgerContext';
import { normalize } from '../../../src/data/icons';
import { useT } from '../../../src/i18n';
import { useTheme } from '../../../src/theme/ThemeContext';
import { Category, CategoryWithSubs } from '../../../src/types';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'new-parent' }
  | { mode: 'new-sub'; parentId: string }
  | { mode: 'edit'; category: Category; parentId: string | null };

export default function CategoriasPage() {
  const { colors } = useTheme();
  const { canWrite } = useLedger();
  const t = useT();
  const { categoriesWithSubs } = useData();
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [query, setQuery] = useState('');

  const close = () => setModal({ mode: 'closed' });

  // Filtra por categoria ou subcategoria (busca sem acento/maiúsculas).
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return categoriesWithSubs;
    return categoriesWithSubs
      .map((cat) => {
        const catMatches = normalize(cat.name).includes(q);
        const subs = cat.subcategories.filter((s) => normalize(s.name).includes(q));
        if (catMatches) return cat;
        if (subs.length > 0) return { ...cat, subcategories: subs };
        return null;
      })
      .filter((c): c is CategoryWithSubs => c !== null);
  }, [categoriesWithSubs, query]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold" style={{ color: colors.text }}>
          {t.categories.title}
        </h1>
        {canWrite && (
          <button
            onClick={() => setModal({ mode: 'new-parent' })}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            <AppIcon icon="plus" size={18} color={colors.onPrimary} /> {t.web.newCategory}
          </button>
        )}
      </div>

      {/* Busca */}
      <div
        className="mb-5 flex items-center gap-2 rounded-xl border px-3"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <AppIcon icon="magnify" size={20} color={colors.textMuted} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.categories.searchPlaceholder}
          className="h-11 flex-1 bg-transparent text-sm outline-none"
          style={{ color: colors.text }}
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery('')}
            aria-label={t.web.clear}
            className="transition hover:opacity-70"
          >
            <AppIcon icon="close-circle" size={18} color={colors.textMuted} />
          </button>
        )}
      </div>

      {filtered.length === 0 && canWrite ? (
        <button
          onClick={() => setModal({ mode: 'new-parent' })}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed p-4 text-left transition hover:opacity-90"
          style={{ backgroundColor: colors.card, borderColor: colors.primary }}
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: hexWithAlpha(colors.primary, 0.16) }}
          >
            <AppIcon icon="plus" size={22} color={colors.primary} />
          </span>
          <span>
            <span className="block font-bold" style={{ color: colors.text }}>
              {query.trim() ? t.web.createNamed(query.trim()) : t.web.newCategory}
            </span>
            <span className="block text-sm" style={{ color: colors.textMuted }}>
              {t.web.noCategoryFound}
            </span>
          </span>
        </button>
      ) : (
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((cat) => (
          <div key={cat.id} className="rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
            <div className="flex items-center gap-3">
              <CategoryIcon icon={cat.icon} color={cat.color} size={44} solid />
              <div className="flex-1 font-bold" style={{ color: colors.text }}>{cat.name}</div>
              {canWrite && (
                <button
                  onClick={() => setModal({ mode: 'edit', category: cat, parentId: null })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
                  style={{ backgroundColor: colors.surface }}
                  aria-label={t.web.edit}
                >
                  <AppIcon icon="pencil" size={16} color={colors.textMuted} />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {cat.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setModal({ mode: 'edit', category: sub, parentId: cat.id })}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition hover:opacity-80"
                  style={{ backgroundColor: hexWithAlpha(cat.color, 0.12), color: colors.text }}
                >
                  <AppIcon icon={sub.icon} size={14} color={cat.color} />
                  {sub.name}
                </button>
              ))}
              {canWrite && (
                <button
                  onClick={() => setModal({ mode: 'new-sub', parentId: cat.id })}
                  className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm font-semibold transition hover:opacity-80"
                  style={{ borderColor: colors.border, color: colors.textMuted }}
                >
                  <AppIcon icon="plus" size={14} color={colors.textMuted} /> {t.web.subcategory}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      <CategoryModal
        open={modal.mode === 'new-parent'}
        onClose={close}
      />
      <CategoryModal
        open={modal.mode === 'new-sub'}
        onClose={close}
        parentId={modal.mode === 'new-sub' ? modal.parentId : undefined}
      />
      <CategoryModal
        open={modal.mode === 'edit'}
        onClose={close}
        category={modal.mode === 'edit' ? modal.category : undefined}
        parentId={modal.mode === 'edit' ? modal.parentId : undefined}
      />
    </div>
  );
}
