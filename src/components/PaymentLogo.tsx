import { BANK_LOGOS } from '../data/bankLogos';
import { getProvider, KIND_ICONS } from '../data/paymentProviders';
import { PaymentKind } from '../types';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';

type Props = {
  /** Chave do logo: banco ("nubank") ou genérico ("dinheiro"). */
  provider: string | null | undefined;
  /** Cor de fundo quando não há logo de banco. */
  color?: string;
  /** Usado no ícone quando não há instituição. */
  kind?: PaymentKind;
  size?: number;
};

/** Cache do data: URI de cada logo — o SVG não muda, não precisa recodificar. */
const uriCache = new Map<string, string>();
function logoUri(id: string, xml: string): string {
  let uri = uriCache.get(id);
  if (!uri) {
    uri = `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`;
    uriCache.set(id, uri);
  }
  return uri;
}

/**
 * Logo do meio de pagamento.
 *
 * Banco vai num quadrado branco arredondado — os logos têm cor própria e
 * sumiriam no tema escuro. O SVG entra como <img>, isolado da página.
 * Genérico vira ícone sobre a cor suave, no estilo do `CategoryIcon`.
 */
export function PaymentLogo({ provider, color, kind, size = 36 }: Props) {
  const logo = provider ? BANK_LOGOS[provider] : undefined;
  const radius = Math.round(size * 0.28);

  if (logo && provider) {
    const pad = Math.round(size * 0.14);
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUri(provider, logo.xml)}
          alt={logo.name}
          width={size - pad * 2}
          height={size - pad * 2}
          draggable={false}
        />
      </span>
    );
  }

  const generic = getProvider(provider);
  const tint = color ?? generic?.color ?? '#64748B';
  const icon = generic?.icon ?? (kind ? KIND_ICONS[kind] : 'wallet-outline');
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: hexWithAlpha(tint, 0.16),
      }}
    >
      <AppIcon icon={icon} size={Math.round(size * 0.56)} color={tint} />
    </span>
  );
}
