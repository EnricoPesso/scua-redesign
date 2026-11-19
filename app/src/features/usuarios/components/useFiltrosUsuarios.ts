import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { TAMANHO_PADRAO, lerFiltros, type FiltrosUsuarios } from '../domain/filtros';

type Mudancas = Partial<Record<keyof FiltrosUsuarios, string>>;
const CHAVES_DE_FILTRO = ['busca', 'gestor', 'departamento', 'situacao', 'pagina'];

/**
 * Filtros, página e tamanho da página vivem na URL e só mudam quando a pessoa mexe neles
 * (abrir ou fechar o painel de um usuário nunca toca nesses valores).
 */
export function useFiltrosUsuarios() {
  const [params, setParams] = useSearchParams();
  const filtros = useMemo(() => lerFiltros(params), [params]);

  const atualizar = useCallback((mudancas: Mudancas) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [chave, valor] of Object.entries(mudancas)) {
        const padrao = valor === '' || (chave === 'situacao' && valor === 'ativos') || (chave === 'pagina' && valor === '1') || (chave === 'tamanho' && valor === String(TAMANHO_PADRAO));
        if (padrao) novo.delete(chave);
        else novo.set(chave, String(valor));
      }
      // Mudou um filtro (e não a página): volta para a primeira página.
      if (!('pagina' in mudancas)) novo.delete('pagina');
      return novo;
    }, { replace: true });
  }, [setParams]);

  /** Limpa os filtros e a página; o tamanho da página é escolha da pessoa e fica. */
  const limpar = useCallback(() => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const c of CHAVES_DE_FILTRO) novo.delete(c);
      return novo;
    }, { replace: true });
  }, [setParams]);

  return { filtros, atualizar, limpar };
}
