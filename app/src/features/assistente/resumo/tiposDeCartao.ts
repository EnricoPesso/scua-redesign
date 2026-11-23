import type { ItemDoResumo, PedidoParaDecidir } from './resumoDoDia';

/** O que uma mensagem do assistente mostra além do texto. */
export type EstadoDoLote = 'aguardando' | 'enviando' | 'concluido' | 'cancelado' | 'substituido';

export type CartaoDaConversa =
  | { tipo: 'resumo'; itens: ItemDoResumo[] }
  | { tipo: 'lote'; dentro: PedidoParaDecidir[]; fora: PedidoParaDecidir[]; estado: EstadoDoLote }
  | { tipo: 'abrir'; rota: string; rotulo: string };
