import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';
import { mensagemParaUsuario } from '../domain/erros';
import { hojeLocal, rotuloPeriodo } from '../domain/formatacao';
import type { Aba } from '../domain/types';
import { useListaPedidos, useTotais } from '../hooks/queries';
import { Contadores } from './Contadores';
import { EstadoLista } from './EstadoLista';
import { FiltrosBarra } from './FiltrosBarra';
import { Paginacao } from './Paginacao';
import { TabelaPedidos, type SelecaoTabela } from './TabelaPedidos';
import { semPaginacao, useFiltros } from './useFiltros';

/** `selecao` é opcional: a Task 13 liga a coluna de seleção só na aba "Para aprovar". */
export function ListaPedidos({ aba, selecao }: { aba: Aba; selecao?: SelecaoTabela }) {
  const { filtros, atualizar, limpar, ativos } = useFiltros(aba);
  const { search } = useLocation();
  const lista = useListaPedidos(filtros);
  const totais = useTotais(semPaginacao(filtros));
  const rotulo = rotuloPeriodo(filtros.de, filtros.ate, hojeLocal());
  const dados = lista.data;

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
        <TabelaPedidos aba={aba} pedidos={lista.data.itens} selecao={selecao} />
        <Paginacao total={lista.data.total} pagina={filtros.pagina} tamanho={filtros.tamanho}
          aoMudar={(pagina, tamanho) => atualizar({ pagina: String(pagina), tamanho: String(tamanho) })} />
      </>
    );
  }

  return (
    <section aria-label="Pedidos" aria-busy={lista.isPlaceholderData || undefined} className="grid min-w-0 gap-4">
      <FiltrosBarra aba={aba} filtros={filtros} ativos={ativos} atualizar={atualizar} limpar={limpar} />
      <Contadores totais={totais} rotulo={rotulo} />
      <div className={cn('grid min-w-0 gap-4', lista.isPlaceholderData && 'opacity-60 transition-opacity')}>{conteudo}</div>
    </section>
  );
}
