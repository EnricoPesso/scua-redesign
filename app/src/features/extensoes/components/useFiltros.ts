import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { hojeLocal, periodoDoMes } from '../domain/formatacao';
import type { Aba, Filtros, FiltrosSemPagina, Status } from '../domain/types';
import { TAMANHOS_PAGINA } from './Paginacao';

const STATUS: Status[] = ['pendente', 'aprovado', 'reprovado', 'cancelado'];
const CHAVES_FILTRO = ['de', 'ate', 'status', 'pessoa', 'gestor', 'grupo'] as const;
export type ChaveFiltro = (typeof CHAVES_FILTRO)[number] | 'pagina' | 'tamanho';

/** Ver "Decisões tomadas no plano" 1–3. */
export function periodoPadrao(aba: Aba, hoje: string): { de: string; ate: string } {
  const mes = periodoDoMes(hoje);
  if (aba === 'aprovar') return { de: '', ate: '' };
  if (aba === 'meus') return { de: mes.de, ate: '' };
  return mes;
}

export function semPaginacao(f: Filtros): FiltrosSemPagina {
  const { pagina, tamanho, ...resto } = f;
  void pagina;
  void tamanho;
  return resto;
}

/** Filtros vivem na URL. Valores inválidos viram o padrão. */
export function useFiltros(aba: Aba) {
  const [params, setParams] = useSearchParams();
  const padrao = periodoPadrao(aba, hojeLocal());
  const pagina = Number(params.get('pagina'));
  const tamanho = Number(params.get('tamanho'));
  const status = params.get('status') as Status | null;

  const filtros: Filtros = {
    aba,
    de: params.get('de') ?? padrao.de,
    ate: params.get('ate') ?? padrao.ate,
    status: status && STATUS.includes(status) ? status : undefined,
    pessoa: params.get('pessoa') || undefined,
    gestor: params.get('gestor') || undefined,
    grupo: params.get('grupo') || undefined,
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
    tamanho: TAMANHOS_PAGINA.includes(tamanho) ? tamanho : 25,
  };
  const ativos = CHAVES_FILTRO.filter((c) => params.has(c)).length;

  const atualizar = useCallback((mudancas: Partial<Record<ChaveFiltro, string>>) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor === undefined) continue;
        // "De"/"Até" vazios são escolha do usuário (sem limite), então ficam na URL.
        if (valor === '' && chave !== 'de' && chave !== 'ate') novo.delete(chave);
        else novo.set(chave, valor);
      }
      if (!('pagina' in mudancas)) novo.delete('pagina');
      return novo;
    }, { replace: true });
  }, [setParams]);

  const limpar = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  return { filtros, atualizar, limpar, ativos };
}
