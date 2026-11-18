import { criarColecao } from './colecao';
import { PESSOAS_DIRETORIO } from './diretorio';

/**
 * Grupos de usuários e quem está em cada um. É a fonte única do limite mensal de extensão:
 * Configurações › Grupos edita os grupos, Usuários › Dados escolhe o grupo de cada pessoa,
 * e a Extensão de jornada lê o limite daqui.
 */

/** `limiteHoras` vazio ('') quer dizer sem limite. */
export interface Grupo { id: string; nome: string; descricao: string; limiteHoras: number | '' }

const mesmoNome = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const grupos = criarColecao<Grupo>(
  'grp',
  () => [
    { id: 'grp-1', nome: 'Comercial', descricao: 'Vendas e relacionamento com clientes.', limiteHoras: 10 },
    { id: 'grp-2', nome: 'Operações', descricao: 'Logística e rotinas operacionais.', limiteHoras: '' },
    { id: 'grp-3', nome: 'Financeiro', descricao: 'Contabilidade, contas a pagar e a receber.', limiteHoras: 10 },
    { id: 'grp-4', nome: 'Tecnologia', descricao: 'Desenvolvimento, infraestrutura e suporte.', limiteHoras: '' },
    { id: 'grp-5', nome: 'Estágio', descricao: 'Estagiários: qualquer extensão precisa de aprovação especial.', limiteHoras: 0 },
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && mesmoNome(i.nome, d.nome)) ? 'Já existe um grupo com esse nome.' : undefined),
);

const GRUPO_DA_DIRETORIA: Record<string, string> = { Comercial: 'grp-1', Operações: 'grp-2', Financeiro: 'grp-3', Tecnologia: 'grp-4' };
/** Exceções à regra "grupo = diretoria" nos dados de exemplo. */
const EXCECOES: Record<string, string | null> = {
  'u-rui': 'grp-5', // estagiário: o caso de limite zero
  'u-carlos': null, // gestores sem grupo: a tela de extensão não tem dado de limite para eles
  'u-olga': null,
  'u-marcos': null,
};

function sementeDoVinculo(): Map<string, string | null> {
  return new Map(PESSOAS_DIRETORIO.map((p) => [p.id, p.id in EXCECOES ? EXCECOES[p.id] : (GRUPO_DA_DIRETORIA[p.diretoria] ?? null)]));
}

let vinculo = sementeDoVinculo();

/** Id do grupo da pessoa, ou null. Um grupo excluído conta como "sem grupo". */
export function grupoDaPessoa(pessoaId: string): string | null {
  const id = vinculo.get(pessoaId) ?? null;
  return id && grupos.itensAgora().some((g) => g.id === id) ? id : null;
}

/** O grupo da pessoa (com o limite), ou undefined. */
export function grupoCompletoDaPessoa(pessoaId: string): Grupo | undefined {
  const id = grupoDaPessoa(pessoaId);
  return id ? grupos.itensAgora().find((g) => g.id === id) : undefined;
}

export function definirGrupoDaPessoa(pessoaId: string, grupoId: string | null): void {
  vinculo.set(pessoaId, grupoId);
}

export function pessoasDoGrupo(grupoId: string): string[] {
  return PESSOAS_DIRETORIO.filter((p) => grupoDaPessoa(p.id) === grupoId).map((p) => p.id);
}

/** Volta aos dados de exemplo (usado nos testes). */
export function resetarGrupos(): void {
  grupos.resetar();
  vinculo = sementeDoVinculo();
}
