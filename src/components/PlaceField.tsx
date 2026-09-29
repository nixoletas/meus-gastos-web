'use client';

import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { extractUrl, isMapsUrl, mapsLinkFor, placeNameFromMapsUrl } from '../utils/place';
import { normalizeText } from '../utils/text';
import { AppIcon } from './AppIcon';

type Props = {
  place: string;
  placeUrl: string | null;
  onChangePlace: (value: string) => void;
  onChangePlaceUrl: (value: string | null) => void;
  /** Lugares já usados, do mais frequente pro menos. */
  suggestions: { name: string; url: string | null }[];
  readOnly?: boolean;
};

/**
 * "Onde foi o gasto": nome do estabelecimento ou link do Google Maps.
 *
 * Colar um link no próprio campo funciona — ele vai para o lugar certo e,
 * quando é o link longo, o nome do lugar sai dele. (No navegador não dá pra
 * seguir o link curto do Maps: o CORS barra; aí o nome fica com a pessoa.)
 */
export function PlaceField({
  place,
  placeUrl,
  onChangePlace,
  onChangePlaceUrl,
  suggestions,
  readOnly,
}: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function applyText(text: string): boolean {
    const url = extractUrl(text);
    if (!url || !isMapsUrl(url)) return false;
    onChangePlaceUrl(url);
    // O "Compartilhar" do Maps manda "Nome do lugar https://maps.app.goo.gl/...".
    const rest = text.replace(url, '').replace(/\s+/g, ' ').trim();
    onChangePlace(placeNameFromMapsUrl(url) ?? (rest || place));
    return true;
  }

  async function pasteFromClipboard() {
    setNotice(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!applyText(text)) setNotice(t.place.clipboardEmpty);
    } catch {
      setNotice(t.place.clipboardEmpty);
    }
  }

  const openLink = mapsLinkFor(place, placeUrl);

  const visibleSuggestions = useMemo(() => {
    if (!focused || readOnly) return [];
    const q = normalizeText(place);
    return suggestions
      .filter((s) => {
        const n = normalizeText(s.name);
        return n !== q && (!q || n.includes(q));
      })
      .slice(0, 6);
  }, [focused, place, suggestions, readOnly]);

  return (
    <div className="mb-4 space-y-2">
      <div
        className="flex items-center gap-2 rounded-xl border px-3"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <AppIcon icon="map-marker-outline" size={18} color={colors.textMuted} />
        <input
          value={place}
          readOnly={readOnly}
          maxLength={120}
          onChange={(e) => {
            if (!applyText(e.target.value)) onChangePlace(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t.place.placeholder}
          className="flex-1 bg-transparent py-2.5 text-sm outline-none"
          style={{ color: colors.text }}
        />
        {!!place && !readOnly && (
          <button type="button" onClick={() => onChangePlace('')} aria-label={t.common.remove}>
            <AppIcon icon="close-circle" size={16} color={colors.textMuted} />
          </button>
        )}
      </div>

      {visibleSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleSuggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChangePlace(s.name);
                if (s.url && !placeUrl) onChangePlaceUrl(s.url);
              }}
              className="flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: colors.surface, color: colors.text }}
            >
              <AppIcon icon="history" size={13} color={colors.textMuted} />
              <span className="truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {placeUrl ? (
          <span
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: colors.primarySoft, color: colors.primary }}
          >
            <AppIcon icon="google-maps" size={14} color={colors.primary} />
            {t.place.linkSaved}
            {!readOnly && (
              <button type="button" onClick={() => onChangePlaceUrl(null)} aria-label={t.place.removeLink}>
                <AppIcon icon="close" size={14} color={colors.primary} />
              </button>
            )}
          </span>
        ) : (
          !readOnly && (
            <button
              type="button"
              onClick={pasteFromClipboard}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80"
              style={{ backgroundColor: colors.surface, color: colors.text }}
            >
              <AppIcon icon="content-paste" size={14} color={colors.textMuted} />
              {t.place.pasteLink}
            </button>
          )
        )}
        {openLink && (
          <a
            href={openLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ backgroundColor: colors.surface, color: colors.text }}
          >
            <AppIcon icon="open-in-new" size={14} color={colors.textMuted} />
            {placeUrl ? t.place.openMaps : t.place.findOnMaps}
          </a>
        )}
      </div>

      {notice && (
        <p className="text-xs" style={{ color: colors.textMuted }}>
          {notice}
        </p>
      )}
    </div>
  );
}
