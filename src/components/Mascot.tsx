// Pim, o porquinho-cofrinho — versão animada em CSS para a web.
// Respira, pisca e "engole" uma moedinha de R$ em loop.

const C = {
  body: '#14B8A6',
  dark: '#0E8F87',
  slot: '#06403E',
  cheek: '#FCA5A5',
  eye: '#0F172A',
  shine: '#FFFFFF',
};

/** Versão estática e compacta para wordmark (sidebar/topbar). */
export function PiggyMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden>
      <path d="M50 62 Q40 28 74 46 Q70 66 60 72 Z" fill={C.dark} />
      <path d="M150 62 Q160 28 126 46 Q130 66 140 72 Z" fill={C.dark} />
      <ellipse cx="100" cy="114" rx="76" ry="62" fill={C.body} />
      <rect x="76" y="60" width="48" height="11" rx="5.5" fill={C.slot} />
      <ellipse cx="100" cy="130" rx="34" ry="22" fill={C.dark} />
      <ellipse cx="89" cy="130" rx="6" ry="8.5" fill={C.slot} />
      <ellipse cx="111" cy="130" rx="6" ry="8.5" fill={C.slot} />
      <circle cx="78" cy="104" r="9" fill={C.eye} />
      <circle cx="122" cy="104" r="9" fill={C.eye} />
      <circle cx="81" cy="101" r="3" fill={C.shine} />
      <circle cx="125" cy="101" r="3" fill={C.shine} />
    </svg>
  );
}

export function Mascot({ size = 160 }: { size?: number }) {
  const coin = size * 0.26;
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      <div className="mascot-coin absolute left-1/2 top-0 -translate-x-1/2" style={{ width: coin, height: coin }}>
        <svg viewBox="0 0 48 48" width={coin} height={coin}>
          <circle cx="24" cy="24" r="22" fill="#D99A00" />
          <circle cx="24" cy="24" r="18" fill="#F5B301" />
          <circle cx="24" cy="24" r="18" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" />
          <text x="24" y="32" fontSize="20" fontWeight="bold" textAnchor="middle" fill="#7A4E00" fontFamily="Arial, sans-serif">R$</text>
        </svg>
      </div>
      <div className="mascot-breathe">
        <svg viewBox="0 0 200 200" width={size} height={size}>
          <g className="mascot-gulp">
            <path d="M50 62 Q40 28 74 46 Q70 66 60 72 Z" fill={C.dark} />
            <path d="M150 62 Q160 28 126 46 Q130 66 140 72 Z" fill={C.dark} />
            <ellipse cx="100" cy="114" rx="76" ry="62" fill={C.body} />
            <rect x="76" y="60" width="48" height="11" rx="5.5" fill={C.slot} />
            <circle cx="56" cy="128" r="13" fill={C.cheek} opacity="0.65" />
            <circle cx="144" cy="128" r="13" fill={C.cheek} opacity="0.65" />
            <ellipse cx="100" cy="130" rx="34" ry="22" fill={C.dark} />
            <ellipse cx="89" cy="130" rx="6" ry="8.5" fill={C.slot} />
            <ellipse cx="111" cy="130" rx="6" ry="8.5" fill={C.slot} />
            <path d="M85 156 Q100 167 115 156" fill="none" stroke={C.slot} strokeWidth="4" strokeLinecap="round" />
            <g className="mascot-eyes-open">
              <circle cx="78" cy="104" r="9" fill={C.eye} />
              <circle cx="122" cy="104" r="9" fill={C.eye} />
              <circle cx="81" cy="101" r="3" fill={C.shine} />
              <circle cx="125" cy="101" r="3" fill={C.shine} />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
