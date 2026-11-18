import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { SimNao, baseDe, mesmoTexto } from './comum';

export interface Justificativa { id: string; descricao: string; ativa: boolean }

export const justificativas = criarColecao<Justificativa>(
  'jus',
  () => [
    { id: 'jus-1', descricao: 'Atendimento a incidente crítico', ativa: true },
    { id: 'jus-2', descricao: 'Curso', ativa: true },
    { id: 'jus-3', descricao: 'Demanda de projeto', ativa: true },
    { id: 'jus-4', descricao: 'Fechamento mensal', ativa: true },
    { id: 'jus-5', descricao: 'Janela de deploy', ativa: true },
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && mesmoTexto(i.descricao, d.descricao)) ? 'Já existe uma justificativa com essa descrição.' : undefined),
);

export const configJustificativas: ConfigCadastro<Justificativa> = {
  ...baseDe('justificativas'),
  singular: 'justificativa',
  genero: 'a',
  colecao: justificativas,
  colunas: [
    { key: 'descricao', header: 'Descrição' },
    { key: 'ativa', header: 'Ativa', render: (i) => <SimNao valor={i.ativa} /> },
  ],
  campos: [
    { chave: 'descricao', rotulo: 'Descrição', tipo: 'texto', obrigatorio: true, maximo: 80 },
    { chave: 'ativa', rotulo: 'Ativa', tipo: 'alternar', dica: 'Justificativas inativas deixam de aparecer ao pedir uma extensão.' },
  ],
  novo: () => ({ descricao: '', ativa: true }),
  nomeDe: (i) => i.descricao,
};
