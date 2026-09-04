/**
 * Qual caderno de gastos ficou aberto da última vez.
 *
 * Vive fora do LedgerContext porque o logout (AuthContext) também precisa
 * limpar — e um importar o outro fecharia um ciclo entre os dois contextos.
 */
const ACTIVE_KEY = 'meus-gastos:caderno-ativo';

/** Dono do caderno guardado, ou null quando é o próprio. */
export function loadActiveLedger(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveLedger(ownerId: string) {
  try {
    window.localStorage.setItem(ACTIVE_KEY, ownerId);
  } catch {
    // Sem persistência a troca vale só para esta aba — não é motivo de erro.
  }
}

export function clearActiveLedger() {
  try {
    window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // idem
  }
}
