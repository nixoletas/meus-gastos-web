'use client';

import { categoryPalette } from '../theme/colors';

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {categoryPalette.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="h-9 w-9 rounded-full transition"
            style={{
              backgroundColor: c,
              outline: active ? `3px solid ${c}` : 'none',
              outlineOffset: 2,
              transform: active ? 'scale(1.1)' : 'scale(1)',
            }}
            aria-label={`Cor ${c}`}
          />
        );
      })}
    </div>
  );
}
