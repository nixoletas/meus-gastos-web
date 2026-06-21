'use client';

type Slice = { value: number; color: string };

type Props = {
  data: Slice[];
  size?: number;
  thickness?: number;
  /** Conteúdo central (ex.: total). */
  children?: React.ReactNode;
  trackColor?: string;
};

/** Gráfico de rosca em SVG (sem dependências). */
export function DonutChart({
  data,
  size = 220,
  thickness = 28,
  children,
  trackColor = '#00000010',
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;
  const segments =
    total > 0
      ? data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return seg;
        })
      : null;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        {segments}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
