'use client';

import { useMemo, useState } from 'react';
import { searchIcons } from '../data/icons';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';

type Props = {
  value: string;
  color: string;
  onChange: (icon: string) => void;
};

export function IconPicker({ value, color, onChange }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchIcons(query).slice(0, 60), [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.web.iconSearchPlaceholder}
        className="mb-3 w-full rounded-xl border px-3 py-2 text-sm outline-none"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text,
        }}
      />
      <div
        className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto rounded-xl p-1 sm:grid-cols-8"
      >
        {results.map((icon) => {
          const active = icon.name === value;
          return (
            <button
              key={icon.name}
              type="button"
              onClick={() => onChange(icon.name)}
              className="flex aspect-square items-center justify-center rounded-xl border transition"
              style={{
                backgroundColor: active ? hexWithAlpha(color, 0.16) : colors.surface,
                borderColor: active ? color : 'transparent',
              }}
              title={icon.name}
            >
              <AppIcon icon={icon.name} size={22} color={active ? color : colors.textMuted} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
