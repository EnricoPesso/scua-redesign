import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { baseDe, mesmoTexto } from './comum';

/** `limiteHoras` vazio ('') quer dizer sem limite. `pessoas` é só informativo (vem do cadastro de usuários). */
export interface Grupo { id: string; nome: string; descricao: string; limiteHoras: number | ''; pessoas: number }

export const grupos = criarColecao<Grupo>(
  'grp',
  () => [
    { id: 'grp-1', nome: 'Comercial', descricao: 'Vendas e relacionamento com clientes.', limiteHoras: 20, pessoas: 6 },
    { id: 'grp-2', nome: 'Operações', descricao: 'Atendimento, suporte e rotinas operacionais.', limiteHoras: 30, pessoas: 8 },
    { id: 'grp-3', nome: 'Financeiro', descricao: 'Contabilidade, contas a pagar e a receber.', limiteHoras: 10, pessoas: 4 },
    { id: 'grp-4', nome: 'Tecnologia', descricao: 'Desenvolvimento, infraestrutura e segurança.', limiteHoras: '', pessoas: 6 },
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && mesmoTexto(i.nome, d.nome)) ? 'Já existe um grupo com esse nome.' : undefined),
);

export const configGrupos: ConfigCadastro<Grupo> = {
  ...baseDe('grupos'),
  singular: 'grupo',
  genero: 'o',
  colecao: grupos,
  colunas: [
    { key: 'nome', header: 'Nome' },
    { key: 'descricao', header: 'Descrição' },
    { key: 'limiteHoras', header: 'Limite mensal de extensão', numeric: true, render: (i) => (i.limiteHoras === '' ? 'Sem limite' : `${i.limiteHoras} h`) },
    { key: 'pessoas', header: 'Pessoas', numeric: true },
  ],
  campos: [
    { chave: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maximo: 60 },
    { chave: 'descricao', rotulo: 'Descrição', tipo: 'textoLongo', maximo: 200 },
    { chave: 'limiteHoras', rotulo: 'Limite mensal de extensão (horas)', tipo: 'numero', minimo: 0, maximo: 744, dica: 'Quantas horas de extensão o grupo pode usar por mês. Deixe vazio para não ter limite.' },
  ],
  novo: () => ({ nome: '', descricao: '', limiteHoras: '', pessoas: 0 }),
  nomeDe: (i) => i.nome,
  avisoAoExcluir: 'As pessoas deste grupo ficam sem grupo.',
};
