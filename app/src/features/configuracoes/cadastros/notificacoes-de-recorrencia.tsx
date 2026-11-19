import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { resumoRecorrencia } from '../domain/recorrencia';
import { SimNao, baseDe } from './comum';
import { NOTIFICACOES_INICIAIS } from './notificacoes';

export interface RegraDeRecorrencia { id: string; acontecimento: string; minimo: number; janelaHoras: number; silencioMinutos: number; ativa: boolean }

export const notificacoesDeRecorrencia = criarColecao<RegraDeRecorrencia>(
  'rec',
  () => [
    { id: 'rec-1', acontecimento: 'Tentativa de acesso fora da jornada', minimo: 5, janelaHoras: 2, silencioMinutos: 60, ativa: true },
    { id: 'rec-2', acontecimento: 'Estação sem agente', minimo: 3, janelaHoras: 24, silencioMinutos: 240, ativa: true },
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && i.acontecimento === d.acontecimento) ? 'Já existe uma regra para esse acontecimento.' : undefined),
);

export const configNotificacoesDeRecorrencia: ConfigCadastro<RegraDeRecorrencia> = {
  ...baseDe('notificacoes-de-recorrencia'),
  singular: 'regra',
  genero: 'a',
  colecao: notificacoesDeRecorrencia,
  colunas: [
    { key: 'acontecimento', header: 'Acontecimento' },
    { key: 'resumo', header: 'Avisar quando repetir', render: (i) => resumoRecorrencia(i) },
    { key: 'silencioMinutos', header: 'Não repetir o aviso por (min)', numeric: true },
    { key: 'ativa', header: 'Ativa', render: (i) => <SimNao valor={i.ativa} /> },
  ],
  campos: [
    { chave: 'acontecimento', rotulo: 'Acontecimento', tipo: 'select', obrigatorio: true, opcoes: NOTIFICACOES_INICIAIS.map((x) => ({ value: x.acontecimento, label: x.acontecimento })) },
    { chave: 'minimo', rotulo: 'Mínimo de eventos', tipo: 'numero', obrigatorio: true, minimo: 2, dica: 'Quantas vezes o acontecimento precisa se repetir para gerar o aviso.' },
    { chave: 'janelaHoras', rotulo: 'Janela de tempo (horas)', tipo: 'numero', obrigatorio: true, minimo: 1, dica: 'As repetições contam dentro deste período.' },
    { chave: 'silencioMinutos', rotulo: 'Não repetir o aviso por (minutos)', tipo: 'numero', obrigatorio: true, minimo: 0, dica: 'Depois de avisar, espera este tempo antes de avisar de novo. Use 0 para não esperar.' },
    { chave: 'ativa', rotulo: 'Ativa', tipo: 'alternar' },
  ],
  novo: () => ({ acontecimento: '', minimo: 3, janelaHoras: 1, silencioMinutos: 60, ativa: true }),
  nomeDe: (i) => `${i.acontecimento} (${resumoRecorrencia(i)})`,
};
