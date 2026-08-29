'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getActiveLang,
  getActiveLocale,
  Lang,
  LANG_COOKIE,
  normalizeLang,
  setActiveLang,
} from './active';
import { en } from './en';
import { pt } from './pt';

export type { Lang } from './active';
export type Dict = typeof pt;

const DICTS: Record<Lang, Dict> = { 'pt-BR': pt, en };

function persist(lang: Lang) {
  try {
    localStorage.setItem(LANG_COOKIE, lang);
  } catch {
    /* modo privado: o cookie abaixo já basta */
  }
  // 1 ano, no site inteiro.
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Dicionário do idioma ativo. */
  t: Dict;
  /** Locale do Intl ("pt-BR" ou "en-US"). */
  locale: string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
  initialLang,
  children,
}: {
  /** Idioma lido do cookie no servidor — igual no primeiro render do cliente. */
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(() => {
    setActiveLang(initialLang);
    return initialLang;
  });

  // Primeira visita (sem cookie): segue o idioma do navegador. Roda depois da
  // hidratação de propósito — mudar antes disso quebraria o HTML do servidor.
  useEffect(() => {
    const hasCookie = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${LANG_COOKIE}=`));
    if (hasCookie) return;
    const guess = normalizeLang(navigator.language) ?? 'pt-BR';
    persist(guess);
    if (guess !== getActiveLang()) {
      setActiveLang(guess);
      setLangState(guess);
    }
  }, []);

  const setLang = (next: Lang) => {
    // Grava antes do setState: os utilitários de data/moeda leem o módulo
    // solto durante a renderização que este setState dispara.
    setActiveLang(next);
    setLangState(next);
    persist(next);
    document.documentElement.lang = next;
  };

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: DICTS[lang], locale: getActiveLocale() }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n deve ser usado dentro de um I18nProvider');
  return ctx;
}

/** Atalho para quem só precisa do dicionário. */
export function useT(): Dict {
  return useI18n().t;
}

/**
 * Dicionário do idioma ativo fora do React — para funções soltas (mensagens de
 * erro em `lib/`, por exemplo) que não podem chamar hook.
 */
export function tNow(): Dict {
  return DICTS[getActiveLang()];
}
