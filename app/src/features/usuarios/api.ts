import { ErroDeValidacao } from '../../mock/colecao';
import { dia, hoje } from '../../mock/datas';
import { PESSOAS_DIRETORIO } from '../../mock/diretorio';
import { rede } from '../../mock/rede';
import { GESTORES_IDS, JORNADAS_ATRIBUIVEIS } from './dados';
import type { Calendario, DadosUsuario, Excecao, Ferias, NovaExcecao, NovasFerias, Permissoes, Substituto, Usuario } from './domain/tipos';
import { validarDados, validarExcecao, validarFerias, validarSubstituto } from './domain/validacao';

const ADMINISTRADORES = ['u-carlos', 'u-marcos'];
const RH = ['u-renata', 'u-karen'];
const SUSTENTACAO = ['u-heitor', 'u-julio', 'u-sara'];
const PRODUCAO = ['u-iara', 'u-nina', 'u-heitor'];
const INATIVOS = ['u-otavio', 'u-tiago'];

function jornadaDe(id: string, departamento: string, i: number): string {
  if (id === 'u-heitor') return 'jor-plantao';
  if (id === 'u-fabio') return 'jor-livre';
  if (departamento === 'Logística') return 'jor-turno-a';
  if (departamento === 'Suporte' || departamento === 'Vendas') return 'jor-com-44h';
  return i % 7 === 3 ? 'jor-adm-6h' : 'jor-adm-8h';
}

/** Semente: as 24 pessoas do diretório, mais o que a tela de usuários precisa. Datas relativas a hoje. */
const semente = (): { usuarios: Usuario[]; seq: number } => {
  const usuarios = PESSOAS_DIRETORIO.map((p, i): Usuario => {
    const jornada = JORNADAS_ATRIBUIVEIS.find((j) => j.id === jornadaDe(p.id, p.departamento, i)) ?? JORNADAS_ATRIBUIVEIS[0];
    const calendarios: Calendario[] = i % 2 === 1 ? ['nacional', 'estadual', 'municipal'] : ['nacional', 'estadual'];
    return {
      id: p.id,
      nome: p.nome,
      login: p.login,
      matricula: p.matricula,
      email: `${p.login}@scua.com.br`,
      whatsapp: `(11) 9${8000 + i * 13}-${1000 + i * 47}`,
      gestorId: p.gestorId,
      departamento: p.departamento,
      jornadaId: jornada.id,
      jornadaNome: jornada.nome,
      ativo: !INATIVOS.includes(p.id),
      permissoes: {
        avisosPorEmail: true,
        liberaRegra: GESTORES_IDS.includes(p.id),
        administrador: ADMINISTRADORES.includes(p.id),
        rhAprovador: RH.includes(p.id),
        sustentacao: SUSTENTACAO.includes(p.id),
        producao: PRODUCAO.includes(p.id),
      },
      feriados: calendarios,
      substituto: null,
      excecoes: [],
      ferias: [],
    };
  });
  const por = (id: string) => usuarios.find((u) => u.id === id)!;
  por('u-carlos').substituto = { pessoaId: 'u-olga', de: dia(8), ate: dia(19) };
  por('u-ana').excecoes = [
    { id: 'exc-1', data: dia(2), entrada: '10:00', saida: '16:00', motivo: 'Consulta médica' },
    { id: 'exc-2', data: dia(9), entrada: '08:00', saida: '12:00', motivo: 'Prova da faculdade' },
  ];
  por('u-ana').ferias = [{ id: 'fer-1', inicio: dia(30), fim: dia(44) }];
  por('u-joao').excecoes = [{ id: 'exc-3', data: dia(3), entrada: '13:00', saida: '18:00', motivo: 'Mudança de casa' }];
  por('u-joao').ferias = [{ id: 'fer-2', inicio: dia(20), fim: dia(34) }];
  por('u-diego').ferias = [{ id: 'fer-3', inicio: dia(-40), fim: dia(-26) }];
  return { usuarios, seq: 10 };
};

let estado: { usuarios: Usuario[]; seq: number } | null = null;
const carregar = () => (estado ??= semente());
const achar = (id: string): Usuario => {
  const u = carregar().usuarios.find((x) => x.id === id);
  if (!u) throw new ErroDeValidacao('Este usuário não existe ou foi removido.');
  return u;
};
const trocar = (id: string, mudar: (u: Usuario) => Usuario): Usuario => {
  const atual = achar(id);
  const novo = mudar(atual);
  const e = carregar();
  e.usuarios = e.usuarios.map((u) => (u.id === id ? novo : u));
  return novo;
};
const conferir = (erros: object) => {
  const primeiro = Object.values(erros).find(Boolean);
  if (primeiro) throw new ErroDeValidacao(String(primeiro));
};
const proximoId = (prefixo: string) => {
  const e = carregar();
  e.seq += 1;
  return `${prefixo}-${e.seq}`;
};
const ano = () => hoje().slice(0, 4);

export const listarUsuarios = (): Promise<Usuario[]> => rede(() => carregar().usuarios);
export const obterUsuario = (id: string): Promise<Usuario | null> => rede(() => carregar().usuarios.find((u) => u.id === id) ?? null);

export function salvarDados(id: string, dados: DadosUsuario): Promise<Usuario> {
  return rede(() => {
    conferir(validarDados(dados));
    const jornada = JORNADAS_ATRIBUIVEIS.find((j) => j.id === dados.jornadaId);
    if (!jornada) throw new ErroDeValidacao('Escolha uma das jornadas da lista.');
    const permissoes: Permissoes = { ...dados.permissoes };
    return trocar(id, (u) => ({
      ...u,
      email: dados.email.trim(),
      whatsapp: dados.whatsapp.trim(),
      gestorId: dados.gestorId,
      departamento: dados.departamento,
      jornadaId: jornada.id,
      jornadaNome: jornada.nome,
      permissoes,
    }));
  });
}

export const salvarFeriados = (id: string, feriados: Calendario[]): Promise<Usuario> => rede(() => trocar(id, (u) => ({ ...u, feriados })));

/** `null` remove o substituto. */
export function salvarSubstituto(id: string, substituto: Substituto | null): Promise<Usuario> {
  return rede(() => {
    if (substituto) conferir(validarSubstituto(substituto, id));
    return trocar(id, (u) => ({ ...u, substituto }));
  });
}

export function adicionarExcecao(id: string, nova: NovaExcecao): Promise<Usuario> {
  return rede(() => {
    conferir(validarExcecao(nova, achar(id).excecoes, hoje()));
    const excecao: Excecao = { ...nova, motivo: nova.motivo.trim(), id: proximoId('exc') };
    return trocar(id, (u) => ({ ...u, excecoes: [...u.excecoes, excecao] }));
  });
}
export const removerExcecao = (id: string, excecaoId: string): Promise<Usuario> =>
  rede(() => trocar(id, (u) => ({ ...u, excecoes: u.excecoes.filter((e) => e.id !== excecaoId) })));

export function adicionarFerias(id: string, novas: NovasFerias): Promise<Usuario> {
  return rede(() => {
    conferir(validarFerias(novas, achar(id).ferias, ano()));
    const ferias: Ferias = { ...novas, id: proximoId('fer') };
    return trocar(id, (u) => ({ ...u, ferias: [...u.ferias, ferias] }));
  });
}
export const removerFerias = (id: string, feriasId: string): Promise<Usuario> =>
  rede(() => trocar(id, (u) => ({ ...u, ferias: u.ferias.filter((f) => f.id !== feriasId) })));

/** Volta aos dados de exemplo (usado nos testes). */
export function resetarUsuarios(): void {
  estado = null;
}

