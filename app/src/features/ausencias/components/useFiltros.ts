import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { dia, hoje } from '../../../mock/datas';
import { OPCOES_PESSOAS } from '../../../mock/diretorio';
import { TAMANHOS_PAGINA } from '../../extensoes/components/Paginacao';
import { diasUteisEntre } from '../domain/ausencias';

const CHAVES = ['colaboradores', 'gestor', 'de', 'ate'] as const;
export type ChaveFiltro = (typeof CHAVES)[number] | 'dia' | 'visao' | 'pagina' | 'tamanho';
export type Visao = 'linha' | 'tabela';

const IDS_VALIDOS = new Set(OPCOES_PESSOAS.map((o) => o.value));

/** Telas de 768px ou mais. Nas menores a tabela é a visão padrão. */
function useTelaLarga(): boolean {
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

/** Filtros, dia, visão e página vivem na URL. Valores inválidos viram o padrão. */
export function useFiltros() {
  const [params, setParams] = useSearchParams();
  const telaLarga = useTelaLarga();

  const de = params.get('de') ?? dia(-6);
  const ate = params.get('ate') ?? hoje();
  const colaboradores = (params.get('colaboradores') ?? '').split(',').filter((id) => IDS_VALIDOS.has(id));
  const gestor = params.get('gestor') ?? '';
  const pagina = Number(params.get('pagina'));
  const tamanho = Number(params.get('tamanho'));
  const visaoUrl = params.get('visao');
  const visao: Visao = visaoUrl === 'linha' || visaoUrl === 'tabela' ? visaoUrl : telaLarga ? 'linha' : 'tabela';

  const atualizar = useCallback((mudancas: Partial<Record<ChaveFiltro, string>>) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [chave, valor] of Object.entries(mudancas)) {
        // "De" e "Até" vazios são escolha da pessoa e ficam na URL (o aviso do período explica).
        if (valor === '' && chave !== 'de' && chave !== 'ate') novo.delete(chave);
        else novo.set(chave, valor);
      }
      if (!('pagina' in mudancas)) novo.delete('pagina');
      // Mudou o filtro: o dia escolhido pode não existir mais no novo período.
      if (!('dia' in mudancas) && ('de' in mudancas || 'ate' in mudancas)) novo.delete('dia');
      return novo;
    }, { replace: true });
  }, [setParams]);

  const limpar = useCallback(() => {
    setParams((atual) => {
      const novo = new URLSearchParams();
      const visaoAtual = atual.get('visao');
      if (visaoAtual) novo.set('visao', visaoAtual);
      return novo;
    }, { replace: true });
  }, [setParams]);

  const diasUteis = diasUteisEntre(de, ate);
  const diaUrl = params.get('dia') ?? '';
  const diaSelecionado = diasUteis.includes(diaUrl) ? diaUrl : (diasUteis[diasUteis.length - 1] ?? '');

  return {
    filtros: { de, ate, colaboradores, gestor },
    visao,
    dia: diaSelecionado,
    diasUteis,
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
    tamanho: TAMANHOS_PAGINA.includes(tamanho) ? tamanho : 25,
    ativos: CHAVES.filter((c) => params.has(c)).length,
    atualizar,
    limpar,
  };
}
