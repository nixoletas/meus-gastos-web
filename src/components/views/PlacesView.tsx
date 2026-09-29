'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { NO_PLACE_KEY, totalsByPlace } from '../../utils/analytics';
import { Period } from '../../utils/date';
import { mapsLinkFor } from '../../utils/place';
import { AppIcon } from '../AppIcon';
import { hexWithAlpha } from '../CategoryIcon';
import { ExpenseList } from './ExpenseList';
import { RankRow } from './RankRow';

type Props = {
  expenses: Expense[];
  date: Date;
  period: Period;
  onOpen: (expense: Expense) => void;
};

/** Onde o dinheiro fica: ranking dos estabelecimentos, com atalho pro Maps. */
export function PlacesView({ expenses, date, period, onOpen }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [date, period]);

  const groups = useMemo(() => totalsByPlace(expenses, date, period), [expenses, date, period]);
  const known = groups.filter((g) => g.key !== NO_PLACE_KEY);
  const unknown = groups.find((g) => g.key === NO_PLACE_KEY);

  if (known.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-2xl px-6 py-14 text-center"
        style={{ backgroundColor: colors.card }}
      >
        <AppIcon icon="map-marker-radius" size={44} color={colors.primary} />
        <p className="max-w-sm" style={{ color: colors.textMuted }}>
          {t.views.placesEmpty}
        </p>
      </div>
    );
  }

  // Participação medida só entre os gastos com local — senão o "sem local"
  // achata todas as barras.
  const knownTotal = known.reduce((s, g) => s + g.total, 0);

  return (
    <div className="space-y-2">
      {unknown && (
        <p
          className="flex items-center gap-2 rounded-xl p-3 text-sm"
          style={{ backgroundColor: colors.surface, color: colors.textMuted }}
        >
          <AppIcon icon="information-outline" size={16} color={colors.textMuted} />
          {t.views.unknownShare(Math.round(unknown.percent * 100))}
        </p>
      )}

      {known.map((g, index) => {
        const open = selected === g.key;
        const link = mapsLinkFor(g.name, g.url);
        return (
          <RankRow
            key={g.key}
            icon={
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-extrabold"
                style={{ backgroundColor: hexWithAlpha(colors.primary, 0.14), color: colors.primary }}
              >
                {g.url ? <AppIcon icon="google-maps" size={20} color={colors.primary} /> : index + 1}
              </span>
            }
            title={g.name ?? t.place.noPlace}
            subtitle={t.views.visits(g.count)}
            total={g.total}
            percent={knownTotal > 0 ? g.total / knownTotal : 0}
            color={colors.primary}
            expanded={open}
            dimmed={selected !== null && !open}
            onClick={() => setSelected(open ? null : g.key)}
          >
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition hover:opacity-80"
                style={{ backgroundColor: colors.surface, color: colors.primary }}
              >
                <AppIcon icon="open-in-new" size={15} color={colors.primary} />
                {g.url ? t.place.openMaps : t.place.findOnMaps}
              </a>
            )}
            <ExpenseList expenses={g.expenses} onOpen={onOpen} />
          </RankRow>
        );
      })}
    </div>
  );
}
