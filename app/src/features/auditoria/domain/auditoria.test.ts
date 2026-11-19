import { describe, expect, it } from 'vitest';
import { abaOuPrimeira, filtrarRegistros, formatarDataHora, nomeDoArquivo, normalizar, type Registro } from './auditoria';

const reg = (id: string, item: string, quando: string, pessoaId = 'u-ana'): Registro =>
  ({ id, aba: 'parametros', item, acao: 'Alterou', anterior: '1', novo: '2', pessoaId, quando });

const lista = [
  reg('1', 'Tolerância de atraso', '2026-10-10T09:00:00'),
  reg('2', 'Exceção de feriado', '2026-10-11T08:30:00', 'u-joao'),
  reg('3', 'Limite diário', '2026-09-01T10:00:00'),
];

describe('abaOuPrimeira', () => {
  it('aceita aba válida e cai na primeira quando inválida ou ausente', () => {
    expect(abaOuPrimeira('whatsapp')).toBe('whatsapp');
    expect(abaOuPrimeira('xyz')).toBe('parametros');
    expect(abaOuPrimeira(undefined)).toBe('parametros');
  });
});

describe('filtrarRegistros', () => {
  const todos = { de: '', ate: '', pessoa: '', busca: '' };
  it('ordena do mais recente para o mais antigo', () => {
    expect(filtrarRegistros(lista, todos).map((r) => r.id)).toEqual(['2', '1', '3']);
  });
  it('filtra pelo período incluindo as duas pontas', () => {
    expect(filtrarRegistros(lista, { ...todos, de: '2026-10-10', ate: '2026-10-10' }).map((r) => r.id)).toEqual(['1']);
  });
  it('filtra por quem alterou', () => {
    expect(filtrarRegistros(lista, { ...todos, pessoa: 'u-joao' }).map((r) => r.id)).toEqual(['2']);
  });
  it('busca por item sem diferenciar acento nem maiúscula', () => {
    expect(filtrarRegistros(lista, { ...todos, busca: 'EXCECAO' }).map((r) => r.id)).toEqual(['2']);
    expect(filtrarRegistros(lista, { ...todos, busca: 'tolerancia' }).map((r) => r.id)).toEqual(['1']);
    expect(filtrarRegistros(lista, { ...todos, busca: 'nada disso' })).toEqual([]);
  });
});

describe('formatação', () => {
  it('data e hora em dd/mm/aaaa hh:mm', () => {
    expect(formatarDataHora('2026-10-11T08:30:00')).toBe('11/10/2026 08:30');
  });
  it('normaliza texto', () => {
    expect(normalizar('  Liberação ')).toBe('liberacao');
  });
  it('nome do arquivo usa a aba e a data', () => {
    expect(nomeDoArquivo('liberacoes', '2026-10-12')).toBe('auditoria-liberacoes-de-regra-2026-10-12.csv');
  });
});
