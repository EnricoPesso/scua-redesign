import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';
import { mensagemParaUsuario } from '../domain/erros';
import { hojeLocal, rotuloPeriodo } from '../domain/formatacao';
import type { Aba } from '../domain/types';
import { useListaPedidos, useTotais } from '../hooks/queries';
import { Contadores } from './Contadores';
import { BarraLote } from './BarraLote';
import { EstadoLista } from './EstadoLista';
import { FiltrosBarra } from './FiltrosBarra';
import { Paginacao } from '../../../componentes/Paginacao';
import { TabelaPedidos, type SelecaoTabela } from './TabelaPedidos';
import { semPaginacao, useFiltros } from './useFiltros';

/** Na aba "Para aprovar" a tabela ganha seleção e a barra de lote. A seleção vale só para a página e os filtros atuais. */
export function ListaPedidos({ aba }: { aba: Aba }) {
  const { filtros, atualizar, limpar, ativos } = useFiltros(aba);
  const chaveFiltros = JSON.stringify(filtros);
  const [selecao, setSelecao] = useState<{ chave: string; ids: ReadonlySet<string> }>({ chave: chaveFiltros, ids: new Set() });
  // Mudou de página ou de filtro: a seleção anterior não vale mais (sem efeito, para não piscar).
  const selecionados = selecao.chave === chaveFiltros ? selecao.ids : new Set<string>();
  const { search } = useLocation();
  const lista = useListaPedidos(filtros);
  const totais = useTotais(semPaginacao(filtros));
  const rotulo = rotuloPeriodo(filtros.de, filtros.ate, hojeLocal());
  const dados = lista.data;

  const marcar = (ids: string[], marcado: boolean) => {
    const novo = new Set(selecionados);
    for (const id of ids) {
      if (marcado) novo.add(id);
      else novo.delete(id);
    }
    setSelecao({ chave: chaveFiltros, ids: novo });
  };
  const controleSelecao: SelecaoTabela | undefined = aba === 'aprovar'
    ? { selecionados, aoAlternar: (id, m) => marcar([id], m), aoAlternarTodos: marcar }
    : undefined;
  // Só os que ainda estão na página: um pedido decidido em outro canal sai da seleção sozinho.
  const pedidosSelecionados = useMemo(
    () => (dados?.itens ?? []).filter((p) => selecionados.has(p.id) && p.status === 'pendente'),
    [dados, selecionados],
  );

  // Página além do fim (URL antiga ou itens que sumiram): volta para a primeira.
  useEffect(() => {
    if (dados && dados.itens.length === 0 && dados.total > 0 && filtros.pagina > 1) atualizar({ pagina: '1' });
  }, [dados, filtros.pagina, atualizar]);

  let conteudo;
  if (lista.isPending) {
    conteudo = <EstadoLista tipo="carregando" />;
  } else if (lista.isError) {
    conteudo = <EstadoLista tipo="erro" mensagem={mensagemParaUsuario(lista.error, 'carregar')} onTentarDeNovo={() => void lista.refetch()} />;
  } else if (lista.data.itens.length === 0 && ativos > 0) {
    conteudo = (
      <EstadoLista tipo="vazio" titulo={`Nenhum pedido ${rotulo} com esses filtros.`}
        acao={<Button variant="secondary" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button>} />
    );
  } else if (lista.data.itens.length === 0) {
    conteudo =
      aba === 'aprovar' ? <EstadoLista tipo="vazio" titulo="Tudo em dia!" texto="Nenhum pedido esperando sua aprovação." />
      : aba === 'meus' ? <EstadoLista tipo="vazio" titulo="Você ainda não pediu nenhuma extensão." acao={<Link to={{ pathname: '/extensoes/meus/novo', search }} className={cn(buttonVariants(), 'max-md:h-11')}>+ Nova extensão</Link>} />
      : <EstadoLista tipo="vazio" titulo={`Nenhum pedido ${rotulo}.`} />;
  } else {
    conteudo = (
      <>
        <TabelaPedidos aba={aba} pedidos={lista.data.itens} selecao={controleSelecao} />
        <Paginacao total={lista.data.total} pagina={filtros.pagina} tamanho={filtros.tamanho}
          aoMudar={(pagina, tamanho) => atualizar({ pagina: String(pagina), tamanho: String(tamanho) })} />
      </>
    );
  }

  return (
    <section aria-label="Pedidos" aria-busy={lista.isPlaceholderData || undefined} className="grid min-w-0 gap-4">
      <FiltrosBarra aba={aba} filtros={filtros} ativos={ativos} atualizar={atualizar} limpar={limpar} />
      <Contadores totais={totais} rotulo={rotulo} soPendentes={aba === 'aprovar'} />
      <div className={cn('grid min-w-0 gap-4', lista.isPlaceholderData && 'opacity-60 transition-opacity')}>{conteudo}</div>
      {/* Fora do ramo da tabela: se a fila esvaziar depois do lote, o diálogo de resultado continua montado. */}
      {aba === 'aprovar' && <BarraLote pedidos={pedidosSelecionados} aoConcluir={() => setSelecao({ chave: chaveFiltros, ids: new Set() })} />}
    </section>
  );
}
