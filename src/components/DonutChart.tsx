'use client';

type Slice = { value: number; color: string; label?: string };

type Props = {
  data: Slice[];
  size?: number;
  thickness?: number;
  /** Conteúdo central (ex.: total). */
  children?: React.ReactNode;
  trackColor?: string;
  /** Fatia destacada; as demais ficam esmaecidas. */
  activeIndex?: number | null;
  /** Torna as fatias clicáveis. Recebe o índice da fatia em `data`. */
  onSelect?: (index: number) => void;
};

/** Gráfico de rosca em SVG (sem dependências). */
export function DonutChart({
  data,
  size = 220,
  thickness = 28,
  children,
  trackColor = '#00000010',
  activeIndex = null,
  onSelect,
}: Props) {
  // A fatia ativa engorda, então o raio já reserva espaço pra ela não vazar.
  const grow = 8;
  const radius = (size - thickness - grow) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;
  const segments =
    total > 0
      ? data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const isActive = activeIndex === i;
          const dimmed = activeIndex !== null && !isActive;
          const seg = (
            <circle
              key={i}
              className={`mg-slice${onSelect ? ' mg-slice-hit' : ''}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={isActive ? thickness + grow : thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              opacity={dimmed ? 0.28 : 1}
              onClick={onSelect ? () => onSelect(i) : undefined}
            >
              {d.label && <title>{d.label}</title>}
            </circle>
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
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
