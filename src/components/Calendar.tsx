'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { monthName, toISODate } from '../utils/date';
import { AppIcon } from './AppIcon';

type Props = {
  selected: Date;
  /** Data máxima selecionável (padrão: hoje — bloqueia futuro). */
  maxDate?: Date;
  onSelect: (date: Date) => void;
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Calendário mensal próprio (mesmo visual do app mobile), com navegação de mês. */
export function Calendar({ selected, maxDate, onSelect }: Props) {
  const { colors } = useTheme();
  const [view, setView] = useState(() => new Date(selected));

  // Mantém o mês exibido em sincronia quando a data selecionada muda por fora.
  useEffect(() => {
    setView(new Date(selected));
  }, [selected]);

  const max = maxDate ?? new Date();
  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selISO = toISODate(selected);
  const maxISO = toISODate(max);
  const todayISO = toISODate(new Date());

  function shiftMonth(delta: number) {
    setView(new Date(year, month + delta, 1));
  }

  return (
    <div
      className="w-full rounded-2xl p-4"
      style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
          style={{ backgroundColor: colors.surface }}
          aria-label="Mês anterior"
        >
          <AppIcon icon="chevron-left" size={20} color={colors.text} />
        </button>
        <span className="text-base font-bold capitalize" style={{ color: colors.text }}>
          {monthName(month)} {year}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
          style={{ backgroundColor: colors.surface }}
          aria-label="Próximo mês"
        >
          <AppIcon icon="chevron-right" size={20} color={colors.text} />
        </button>
      </div>

      <div className="mb-1 flex">
        {WEEKDAYS.map((w, i) => (
          <span
            key={i}
            className="flex-1 text-center text-xs font-semibold"
            style={{ color: colors.textMuted }}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: '1' }} />;
          }
          const date = new Date(year, month, day);
          const iso = toISODate(date);
          const isSelected = iso === selISO;
          const isFuture = iso > maxISO;
          const isToday = iso === todayISO;
          return (
            <div
              key={day}
              className="flex items-center justify-center"
              style={{ width: `${100 / 7}%`, aspectRatio: '1' }}
            >
              <button
                type="button"
                disabled={isFuture}
                onClick={() => onSelect(date)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm transition disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  border: !isSelected && isToday ? `1.5px solid ${colors.primary}` : undefined,
                  color: isFuture ? colors.border : isSelected ? colors.onPrimary : colors.text,
                  fontWeight: isSelected || isToday ? 700 : 500,
                }}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onSelect(new Date())}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition hover:opacity-80"
        style={{ backgroundColor: colors.surface, color: colors.primary }}
      >
        <AppIcon icon="calendar-today" size={16} color={colors.primary} />
        Hoje
      </button>
    </div>
  );
}
