'use client';

import { useMemo, useState } from 'react';
import {
  EMOJI_PREFIX,
  isEmojiIcon,
  looksLikeEmoji,
  searchEmojis,
  toEmojiIcon,
} from '../data/emojis';
import { normalize, searchIcons } from '../data/icons';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';

type Props = {
  value: string;
  color: string;
  onChange: (icon: string) => void;
};

type Tab = 'icons' | 'emojis';

export function IconPicker({ value, color, onChange }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [tab, setTab] = useState<Tab>(() => (isEmojiIcon(value) ? 'emojis' : 'icons'));
  const [query, setQuery] = useState('');
  const [pasted, setPasted] = useState('');

  const icons = useMemo(() => (tab === 'icons' ? searchIcons(query) : []), [tab, query]);
  const emojis = useMemo(
    () => (tab === 'emojis' ? searchEmojis(query, normalize) : []),
    [tab, query]
  );
  const total = tab === 'icons' ? icons.length : emojis.length;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'icons', label: t.iconPicker.tabIcons },
    { key: 'emojis', label: t.iconPicker.tabEmojis },
  ];

  function usePasted() {
    const char = pasted.trim();
    if (!looksLikeEmoji(char)) return;
    onChange(toEmojiIcon(char));
    setPasted('');
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{ backgroundColor: colors.surface }}
        >
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setTab(item.key);
                  setQuery('');
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                style={{
                  backgroundColor: active ? hexWithAlpha(colors.primary, 0.16) : 'transparent',
                  color: active ? colors.primary : colors.textMuted,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-xs" style={{ color: colors.textMuted }}>
          {t.iconPicker.count(total)}
        </span>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          tab === 'icons' ? t.web.iconSearchPlaceholder : t.iconPicker.emojiSearchPlaceholder
        }
        className="mb-3 w-full rounded-xl border px-3 py-2 text-sm outline-none"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text,
        }}
      />

      {/* Sem corte artificial: a busca é que estreita a lista, e o grid rola. */}
      <div className="grid max-h-72 grid-cols-6 gap-2 overflow-y-auto rounded-xl p-1 sm:grid-cols-8">
        {tab === 'icons'
          ? icons.map((icon) => {
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
            })
          : emojis.map((entry) => {
              const name = EMOJI_PREFIX + entry.char;
              const active = name === value;
              return (
                <button
                  key={entry.char}
                  type="button"
                  onClick={() => onChange(name)}
                  className="flex aspect-square items-center justify-center rounded-xl border text-xl transition"
                  style={{
                    backgroundColor: active ? hexWithAlpha(color, 0.16) : colors.surface,
                    borderColor: active ? color : 'transparent',
                  }}
                  title={entry.keywords[0]}
                >
                  {entry.char}
                </button>
              );
            })}

        {total === 0 && (
          <p className="col-span-full py-6 text-center text-sm" style={{ color: colors.textMuted }}>
            {tab === 'icons' ? t.iconPicker.empty : t.iconPicker.emojiEmpty}
          </p>
        )}
      </div>

      {/* A lista é um atalho; qualquer emoji do teclado serve. */}
      {tab === 'emojis' && (
        <div className="mt-3 flex gap-2">
          <input
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                usePasted();
              }
            }}
            placeholder={t.iconPicker.pasteEmoji}
            className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            }}
          />
          <button
            type="button"
            onClick={usePasted}
            disabled={!looksLikeEmoji(pasted)}
            className="rounded-xl px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            {t.iconPicker.use}
          </button>
        </div>
      )}
    </div>
  );
}
