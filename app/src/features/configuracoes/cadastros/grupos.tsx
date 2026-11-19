import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { grupos, pessoasDoGrupo, type Grupo } from '../../../mock/grupos';
import { baseDe } from './comum';

// A coleção e o vínculo pessoa → grupo ficam em mock/grupos: Usuários e Extensões também usam.
export { grupos };
export type { Grupo };

export const configGrupos: ConfigCadastro<Grupo> = {
  ...baseDe('grupos'),
  singular: 'grupo',
  genero: 'o',
  colecao: grupos,
  colunas: [
    { key: 'nome', header: 'Nome' },
    { key: 'descricao', header: 'Descrição' },
    { key: 'limiteHoras', header: 'Limite mensal de extensão', numeric: true, render: (i) => (i.limiteHoras === '' ? 'Sem limite' : `${i.limiteHoras} h`) },
    // Quem está no grupo é escolhido em Usuários › Dados.
    { key: 'pessoas', header: 'Pessoas', numeric: true, render: (i) => String(pessoasDoGrupo(i.id).length) },
  ],
  campos: [
    { chave: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maximo: 60 },
    { chave: 'descricao', rotulo: 'Descrição', tipo: 'textoLongo', maximo: 200 },
    { chave: 'limiteHoras', rotulo: 'Limite mensal de extensão (horas)', tipo: 'numero', minimo: 0, maximo: 744, dica: 'Quantas horas de extensão cada pessoa do grupo pode usar por mês. Deixe vazio para não ter limite.' },
  ],
  novo: () => ({ nome: '', descricao: '', limiteHoras: '' }),
  nomeDe: (i) => i.nome,
  avisoAoExcluir: 'As pessoas deste grupo ficam sem grupo.',
};
