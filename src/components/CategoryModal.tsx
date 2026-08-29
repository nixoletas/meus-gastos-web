'use client';

import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { Category } from '../types';
import { categoryPalette } from '../theme/colors';
import { CategoryIcon } from './CategoryIcon';
import { ColorPicker } from './ColorPicker';
import { ConfirmDialog } from './ConfirmDialog';
import { IconPicker } from './IconPicker';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
  /** Quando definido, cria/edita uma subcategoria desta categoria-mãe. */
  parentId?: string | null;
};

export function CategoryModal({ open, onClose, category, parentId }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const { categories, addCategory, updateCategory, deleteCategory } = useData();

  const parent = parentId ? categories.find((c) => c.id === parentId) : undefined;
  const isSub = !!parentId;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState(categoryPalette[0]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setName('');
      setIcon(isSub ? 'tag' : 'shape');
      setColor(parent?.color ?? categoryPalette[0]);
    }
  }, [open, category, isSub, parent?.color]);

  // Subcategoria herda a cor da mãe.
  const effectiveColor = isSub ? parent?.color ?? color : color;
  const canSave = name.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      icon,
      color: effectiveColor,
      parent_id: parentId ?? null,
    };
    if (category) await updateCategory(category.id, payload);
    else await addCategory(payload);
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!category) return;
    setDeleting(true);
    await deleteCategory(category.id);
    setDeleting(false);
    setConfirmDelete(false);
    onClose();
  }

  const title = category
    ? isSub
      ? t.categoryForm.editSub
      : t.categoryForm.editCat
    : isSub
      ? t.categoryForm.newSub
      : t.categoryForm.newCat;

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={520}>
      <div className="mb-5 flex items-center gap-3">
        <CategoryIcon icon={icon} color={effectiveColor} size={56} solid />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            isSub ? t.web.subcategoryNamePlaceholder : t.web.categoryNamePlaceholder
          }
          className="flex-1 rounded-xl border px-3 py-3 text-lg font-semibold outline-none"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
        />
      </div>

      {!isSub && (
        <div className="mb-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            {t.categoryForm.color}
          </div>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      )}

      <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
        {t.web.icon}
      </div>
      <IconPicker value={icon} color={effectiveColor} onChange={setIcon} />

      <div className="mt-6 flex items-center gap-3">
        {category && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl px-4 py-3 text-sm font-bold transition hover:opacity-80"
            style={{ backgroundColor: colors.dangerSoft, color: colors.danger }}
          >
            {t.common.delete}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="ml-auto rounded-xl px-6 py-3 font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
        >
          {saving ? t.web.saving : t.common.save}
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={isSub ? t.web.deleteSubTitle : t.web.deleteCatTitle}
        message={isSub ? t.web.deleteSubMessage : t.web.deleteCatMessage}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Modal>
  );
}
