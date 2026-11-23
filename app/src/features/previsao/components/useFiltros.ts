import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { DIRETORIAS, GESTORES } from '../../../mock/diretorio';
import type { FiltroPrevisao, Nivel } from '../domain/previsao';

const NIVEIS: Nivel[] = ['alto', 'medio', 'baixo'];
const GESTORES_VALIDOS = new Set(GESTORES.map((g) => g.id));
const DIRETORIAS_VALIDAS = new Set<string>(DIRETORIAS);

export type ChaveFiltro = 'gestor' | 'diretoria' | 'nivel';

/** Filtros e pessoa aberta vivem na URL. Valor inválido vira "todos". */
export function useFiltros() {
  const [params, setParams] = useSearchParams();
  const gestor = params.get('gestor') ?? '';
  const diretoria = params.get('diretoria') ?? '';
  const nivel = params.get('nivel') ?? '';

  const filtros: FiltroPrevisao = {
    gestor: GESTORES_VALIDOS.has(gestor) ? gestor : '',
    diretoria: DIRETORIAS_VALIDAS.has(diretoria) ? diretoria : '',
    nivel: (NIVEIS as string[]).includes(nivel) ? (nivel as Nivel) : '',
  };

  const atualizar = useCallback((mudancas: Partial<Record<ChaveFiltro, string>>) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor) novo.set(chave, valor);
        else novo.delete(chave);
      }
      return novo;
    }, { replace: true });
  }, [setParams]);

  const limpar = useCallback(() => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const c of ['gestor', 'diretoria', 'nivel']) novo.delete(c);
      return novo;
    }, { replace: true });
  }, [setParams]);

  const abrir = useCallback((id: string | null) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      if (id) novo.set('pessoa', id);
      else novo.delete('pessoa');
      return novo;
    });
  }, [setParams]);

  return {
    filtros,
    ativos: Object.values(filtros).filter(Boolean).length,
    pessoaAberta: params.get('pessoa') ?? '',
    atualizar,
    limpar,
    abrir,
  };
}
