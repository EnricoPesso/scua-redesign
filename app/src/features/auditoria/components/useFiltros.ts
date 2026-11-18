import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { dia, hoje } from '../../../mock/datas';
import { OPCOES_PESSOAS } from '../../../mock/diretorio';
import { TAMANHOS_PAGINA } from '../../extensoes/components/Paginacao';

const CHAVES = ['de', 'ate', 'quem', 'busca'] as const;
export type ChaveFiltro = (typeof CHAVES)[number] | 'pagina' | 'tamanho';

const IDS_VALIDOS = new Set(OPCOES_PESSOAS.map((o) => o.value));

/** Telas de 768px ou mais mostram tabela; as menores, cartões. */
export function useTelaLarga(): boolean {
  const consulta = '(min-width: 768px)';
  const [larga, setLarga] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const aoMudar = () => setLarga(m.matches);
    m.addEventListener?.('change', aoMudar);
    return () => m.removeEventListener?.('change', aoMudar);
  }, []);
  return larga;
}

/** Filtros e página vivem na URL. Valores inválidos viram o padrão; o tamanho da página nunca muda sozinho. */
export function useFiltros() {
  const [params, setParams] = useSearchParams();
  const pagina = Number(params.get('pagina'));
  const tamanho = Number(params.get('tamanho'));
  const quem = params.get('quem') ?? '';

  const filtros = {
    de: params.get('de') ?? dia(-29),
    ate: params.get('ate') ?? hoje(),
    pessoa: IDS_VALIDOS.has(quem) ? quem : '',
    busca: params.get('busca') ?? '',
  };

  const atualizar = useCallback((mudancas: Partial<Record<ChaveFiltro, string>>) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [chave, valor] of Object.entries(mudancas)) {
        // "De" e "Até" vazios são escolha da pessoa (sem limite) e ficam na URL.
        if (valor === '' && chave !== 'de' && chave !== 'ate') novo.delete(chave);
        else novo.set(chave, valor);
      }
      if (!('pagina' in mudancas)) novo.delete('pagina');
      return novo;
    }, { replace: true });
  }, [setParams]);

  const limpar = useCallback(() => {
    // Só os filtros: o tamanho da página escolhido continua.
    setParams((atual) => {
      const novo = new URLSearchParams();
      const t = atual.get('tamanho');
      if (t) novo.set('tamanho', t);
      return novo;
    }, { replace: true });
  }, [setParams]);

  return {
    filtros,
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
    tamanho: TAMANHOS_PAGINA.includes(tamanho) ? tamanho : 25,
    ativos: CHAVES.filter((c) => params.has(c)).length,
    search: params.toString(),
    atualizar,
    limpar,
  };
}
