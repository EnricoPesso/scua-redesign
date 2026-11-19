import { useCallback, useState } from 'react';

/** Chave da preferência no navegador. Lida também pelo script do index.html, antes do React. */
export const CHAVE_TEMA = 'scua.tema';

export type Tema = 'claro' | 'escuro';

const temaAtual = (): Tema => (document.documentElement.classList.contains('dark') ? 'escuro' : 'claro');

/**
 * Tema claro/escuro. A cor vem toda dos tokens do sistema de design: aqui só se põe ou tira
 * a classe `dark` do <html> e se guarda a escolha da pessoa.
 */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaAtual);
  const alternar = useCallback(() => {
    const novo: Tema = temaAtual() === 'escuro' ? 'claro' : 'escuro';
    document.documentElement.classList.toggle('dark', novo === 'escuro');
    try {
      window.localStorage.setItem(CHAVE_TEMA, novo);
    } catch {
      // sem localStorage (modo privado): o tema só não é lembrado
    }
    setTema(novo);
  }, []);
  return { tema, alternar };
}
