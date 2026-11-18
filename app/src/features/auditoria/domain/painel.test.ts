import { describe, expect, it } from 'vitest';
import type { Registro } from './auditoria';
import { resumirAuditoria } from './painel';

const r = (id: string, aba: Registro['aba'], acao: Registro['acao'], pessoaId: string, quando: string): Registro =>
  ({ id, aba, item: 'Item', acao, anterior: null, novo: null, pessoaId, quando });

const registros: Registro[] = [
  r('1', 'jornadas', 'Alterou', 'u-ana', '2026-10-10T09:00:00'),
  r('2', 'jornadas', 'Criou', 'u-ana', '2026-10-10T10:00:00'),
  r('3', 'parametros', 'Excluiu', 'u-joao', '2026-10-12T11:00:00'),
  r('4', 'whatsapp', 'Alterou', 'u-ana', '2026-10-12T12:00:00'),
];

describe('painel da auditoria', () => {
  it('conta alterações, criações, exclusões e pessoas', () => {
    const p = resumirAuditoria(registros, '2026-10-10', '2026-10-12');
    expect(p).toMatchObject({ total: 4, criacoes: 1, alteracoes: 2, exclusoes: 1, pessoas: 2 });
  });

  it('por área: as 5 áreas na ordem das abas, inclusive as zeradas', () => {
    const p = resumirAuditoria(registros, '2026-10-10', '2026-10-12');
    expect(p.porArea.map((a) => [a.aba, a.total])).toEqual([['parametros', 1], ['jornadas', 2], ['excecoes', 0], ['liberacoes', 0], ['whatsapp', 1]]);
    expect(p.areaMaisAlterada).toBe('Jornadas');
  });

  it('quem mais alterou: maior primeiro, no máximo 5', () => {
    const p = resumirAuditoria(registros, '2026-10-10', '2026-10-12');
    expect(p.quemMaisAlterou.map((q) => [q.nome, q.total])).toEqual([['Ana Souza', 3], ['João Lima', 1]]);
  });

  it('por dia: um valor para cada dia do período, com zero nos dias sem alteração', () => {
    const p = resumirAuditoria(registros, '2026-10-10', '2026-10-12');
    expect(p.porDia).toEqual([{ dia: '2026-10-10', total: 2 }, { dia: '2026-10-11', total: 0 }, { dia: '2026-10-12', total: 2 }]);
  });

  it('sem período definido, usa do primeiro ao último registro; sem registros, tudo zerado', () => {
    expect(resumirAuditoria(registros, '', '').porDia).toHaveLength(3);
    const vazio = resumirAuditoria([], '', '');
    expect(vazio).toMatchObject({ total: 0, pessoas: 0, areaMaisAlterada: null, porDia: [], quemMaisAlterou: [] });
  });
});
