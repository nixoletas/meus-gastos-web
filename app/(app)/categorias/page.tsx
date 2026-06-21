'use client';

import { useState } from 'react';
import { AppIcon } from '../../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../../src/components/CategoryIcon';
import { CategoryModal } from '../../../src/components/CategoryModal';
import { useData } from '../../../src/context/DataContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { Category } from '../../../src/types';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'new-parent' }
  | { mode: 'new-sub'; parentId: string }
  | { mode: 'edit'; category: Category; parentId: string | null };

export default function CategoriasPage() {
  const { colors } = useTheme();
  const { categoriesWithSubs } = useData();
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });

  const close = () => setModal({ mode: 'closed' });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold" style={{ color: colors.text }}>Categorias</h1>
        <button
          onClick={() => setModal({ mode: 'new-parent' })}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          <AppIcon icon="plus" size={18} color={colors.onPrimary} /> Nova categoria
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categoriesWithSubs.map((cat) => (
          <div key={cat.id} className="rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
            <div className="flex items-center gap-3">
              <CategoryIcon icon={cat.icon} color={cat.color} size={44} solid />
              <div className="flex-1 font-bold" style={{ color: colors.text }}>{cat.name}</div>
              <button
                onClick={() => setModal({ mode: 'edit', category: cat, parentId: null })}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
                style={{ backgroundColor: colors.surface }}
                aria-label="Editar"
              >
                <AppIcon icon="pencil" size={16} color={colors.textMuted} />
              </button>
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
              <button
                onClick={() => setModal({ mode: 'new-sub', parentId: cat.id })}
                className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm font-semibold transition hover:opacity-80"
                style={{ borderColor: colors.border, color: colors.textMuted }}
              >
                <AppIcon icon="plus" size={14} color={colors.textMuted} /> Subcategoria
              </button>
            </div>
          </div>
        ))}
      </div>

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
