import { describe, expect, it } from 'vitest';
import { filtrarUsuarios, lerFiltros, restringe, temFiltro, textoContagem, type FiltrosUsuarios } from './filtros';
import { dataCurta, resumoSubstituto } from './formatacao';
import type { Usuario } from './tipos';

const PADRAO: FiltrosUsuarios = { busca: '', gestor: '', departamento: '', situacao: 'ativos', pagina: 1, tamanho: 25 };
const u = (id: string, nome: string, login: string, gestorId: string | null, departamento: string, ativo = true): Usuario => ({
  id, nome, login, matricula: '1', email: '', whatsapp: '', gestorId, departamento, jornadaId: 'j', jornadaNome: 'J', ativo,
  permissoes: { avisosPorEmail: false, liberaRegra: false, administrador: false, rhAprovador: false, sustentacao: false, producao: false },
  feriados: [], substituto: null, excecoes: [], ferias: [],
});
const usuarios = [
  u('1', 'João Lima', 'joao.lima', 'u-carlos', 'Vendas'),
  u('2', 'Ana Souza', 'ana.souza', 'u-carlos', 'Vendas'),
  u('3', 'Xavier Pinto', 'xavier.pinto', 'u-olga', 'Fiscal'),
  u('4', 'Tiago Moreira', 'tiago.moreira', 'u-olga', 'Fiscal', false),
];

describe('lerFiltros', () => {
  it('sem parâmetros, usa os padrões', () => expect(lerFiltros(new URLSearchParams())).toEqual(PADRAO));
  it('lê os valores válidos', () => {
    const f = lerFiltros(new URLSearchParams('busca=ana&gestor=u-carlos&departamento=Vendas&situacao=todos&pagina=3&tamanho=10'));
    expect(f).toEqual({ busca: 'ana', gestor: 'u-carlos', departamento: 'Vendas', situacao: 'todos', pagina: 3, tamanho: 10 });
  });
  it('valores inválidos caem nos padrões', () => {
    const f = lerFiltros(new URLSearchParams('gestor=nao-existe&departamento=Marte&situacao=xx&pagina=-2&tamanho=9999'));
    expect(f).toEqual(PADRAO);
    expect(lerFiltros(new URLSearchParams('pagina=1.5&tamanho=abc')).pagina).toBe(1);
    expect(lerFiltros(new URLSearchParams('pagina=0')).pagina).toBe(1);
  });
});

describe('filtrarUsuarios', () => {
  it('por padrão só mostra os ativos', () => expect(filtrarUsuarios(usuarios, PADRAO).map((x) => x.id)).toEqual(['1', '2', '3']));
  it('situação inativos e todos', () => {
    expect(filtrarUsuarios(usuarios, { ...PADRAO, situacao: 'inativos' }).map((x) => x.id)).toEqual(['4']);
    expect(filtrarUsuarios(usuarios, { ...PADRAO, situacao: 'todos' })).toHaveLength(4);
  });
  it('busca por nome ou login, sem acento e sem diferenciar maiúsculas', () => {
    expect(filtrarUsuarios(usuarios, { ...PADRAO, busca: 'JOAO' }).map((x) => x.id)).toEqual(['1']);
    expect(filtrarUsuarios(usuarios, { ...PADRAO, busca: 'ana.so' }).map((x) => x.id)).toEqual(['2']);
    expect(filtrarUsuarios(usuarios, { ...PADRAO, busca: 'joão' }).map((x) => x.id)).toEqual(['1']);
  });
  it('por gestor e departamento, combinados', () => {
    expect(filtrarUsuarios(usuarios, { ...PADRAO, gestor: 'u-olga' }).map((x) => x.id)).toEqual(['3']);
    expect(filtrarUsuarios(usuarios, { ...PADRAO, departamento: 'Vendas', gestor: 'u-olga' })).toEqual([]);
  });
});

describe('temFiltro, restringe e textoContagem', () => {
  it('a situação padrão não conta como filtro', () => expect(temFiltro(PADRAO)).toBe(false));
  it('qualquer mudança conta', () => {
    expect(temFiltro({ ...PADRAO, busca: 'a' })).toBe(true);
    expect(temFiltro({ ...PADRAO, situacao: 'todos' })).toBe(true);
  });
  it('contagem no singular e no plural, com ou sem filtros', () => {
    expect(textoContagem(24, { ...PADRAO, situacao: 'todos' })).toBe('24 usuários');
    expect(textoContagem(1, { ...PADRAO, busca: 'ana' })).toBe('1 usuário com esses filtros');
    expect(textoContagem(3, { ...PADRAO, gestor: 'u-olga' })).toBe('3 usuários com esses filtros');
    expect(restringe({ ...PADRAO, situacao: 'todos' })).toBe(false);
  });
});

describe('formatação', () => {
  it('dataCurta omite o ano de referência', () => {
    expect(dataCurta('2026-10-20', '2026')).toBe('20/10');
    expect(dataCurta('2027-01-05', '2026')).toBe('05/01/2027');
  });
  it('resumo do substituto', () => {
    expect(resumoSubstituto('Olga Prado', 'Carlos Mendes', '2026-10-20', '2026-10-31', '2026')).toBe('Olga Prado aprova no lugar de Carlos Mendes de 20/10 a 31/10');
  });
});
