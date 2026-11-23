import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hoje as hojeIso } from '../../../mock/datas';
import { diasDeTodos } from '../../../mock/jornadaReal';
import { ESTACOES_DIRETORIO, PESSOAS_DIRETORIO, nomeDe } from '../../../mock/diretorio';
import { extensoesApi } from '../../extensoes/api/extensoesApi';
import { mesDe } from '../../extensoes/domain/formatacao';
import type { Filtros, Pedido, Permissoes, ResumoBeneficiario } from '../../extensoes/domain/types';
import { usePermissoes } from '../../extensoes/hooks/queries';
import { chaveDoResumo, classificarPedidos, equipeVisivel, montarResumo, type PedidoParaDecidir, type ResumoDoDia } from './resumoDoDia';

const POR_PAGINA = 50;
const MAX_PAGINAS = 10;

const filtros = (aba: Filtros['aba'], pagina: number): Filtros => ({ aba, de: '', ate: '', status: 'pendente', pagina, tamanho: POR_PAGINA });

/** Todos os pedidos pendentes da fila de quem decide (percorre as páginas). */
async function pedidosPendentesDaFila(): Promise<Pedido[]> {
  const todos: Pedido[] = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const r = await extensoesApi.listar(filtros('aprovar', pagina));
    todos.push(...r.itens);
    if (todos.length >= r.total || r.itens.length === 0) break;
  }
  return todos.filter((p) => p.status === 'pendente');
}

/**
 * Os pedidos esperando a decisão da pessoa, já separados entre dentro e fora do limite do grupo.
 * Usa as mesmas chamadas da tela de Extensões (lista da aba "Para aprovar" e resumo do mês de cada pessoa).
 */
export async function carregarPedidosParaDecidir(hoje: string): Promise<PedidoParaDecidir[]> {
  const pedidos = await pedidosPendentesDaFila();
  const pares = new Map<string, { id: string; mes: string }>();
  for (const p of pedidos) pares.set(chaveDoResumo(p.beneficiario.id, mesDe(p.dataInicial)), { id: p.beneficiario.id, mes: mesDe(p.dataInicial) });
  const resumos = new Map<string, ResumoBeneficiario | null>();
  await Promise.all([...pares.entries()].map(async ([chave, { id, mes }]) => {
    try {
      resumos.set(chave, await extensoesApi.resumo(id, mes));
    } catch {
      // Sem o dado do limite não dá para garantir que cabe: o pedido fica de fora do lote.
      resumos.set(chave, null);
    }
  }));
  return classificarPedidos(pedidos, resumos, hoje);
}

interface DadosBuscados { pedidos: PedidoParaDecidir[]; meusPendentes: number }

async function buscar(p: Permissoes, hoje: string): Promise<DadosBuscados> {
  const [pedidos, meus] = await Promise.all([
    p.podeAprovar ? carregarPedidosParaDecidir(hoje) : Promise.resolve([]),
    p.podePedir ? extensoesApi.listar({ ...filtros('meus', 1), tamanho: 1 }) : Promise.resolve({ itens: [], total: 0 }),
  ]);
  return { pedidos, meusPendentes: meus.total };
}

export interface ResumoDoDiaCarregado {
  /** null enquanto carrega ou se a busca falhou. */
  resumo: ResumoDoDia | null;
  pedidos: PedidoParaDecidir[];
  carregando: boolean;
  erro: boolean;
  tentarDeNovo: () => void;
}

/**
 * O resumo do dia de quem está logado. A chave começa com "extensoes": decidir um pedido (em qualquer tela)
 * refaz a busca sozinho, e o resumo se atualiza.
 * Os dias de jornada e as estações ainda vêm dos dados de exemplo (não há API para eles).
 */
export function useResumoDoDia(): ResumoDoDiaCarregado {
  const permissoes = usePermissoes().data;
  const hoje = hojeIso();
  const consulta = useQuery({
    queryKey: ['extensoes', 'resumo-do-dia', permissoes?.usuario.id, hoje],
    queryFn: () => buscar(permissoes!, hoje),
    enabled: Boolean(permissoes),
    staleTime: 30_000,
  });
  const dias = useMemo(() => diasDeTodos(-14, -1), []);

  const resumo = useMemo(() => {
    if (!permissoes || !consulta.data) return null;
    return montarResumo({
      permissoes, hoje,
      pedidos: consulta.data.pedidos,
      meusPendentes: consulta.data.meusPendentes,
      equipe: equipeVisivel(permissoes, PESSOAS_DIRETORIO),
      dias,
      estacoes: ESTACOES_DIRETORIO,
    }, nomeDe);
  }, [permissoes, consulta.data, hoje, dias]);

  return {
    resumo,
    pedidos: consulta.data?.pedidos ?? [],
    carregando: Boolean(permissoes) && consulta.isPending,
    erro: consulta.isError,
    tentarDeNovo: () => void consulta.refetch(),
  };
}

