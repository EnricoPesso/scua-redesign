import { describe, expect, it, vi } from 'vitest';
import { criarPedidoDb, entrarComo } from './db';

describe('mock de extensões: datas', () => {
  it('a data de criação é gravada no horário local, para um pedido feito à noite não cair no dia seguinte', () => {
    vi.setSystemTime(new Date('2026-10-12T22:30:00'));
    try {
      entrarComo('ana');
      const novo = criarPedidoDb({ beneficiarioId: 'u-ana', dataInicial: '2026-10-28', dataFinal: '2026-10-28', horario: { inicio: '18:00', fim: '19:00' }, justificativaCodigo: '5', detalhes: '' });
      expect(typeof novo).toBe('object');
      if (typeof novo !== 'object') return;
      expect(novo.criadoEm).toBe('2026-10-12T22:30:00');
    } finally {
      vi.setSystemTime(new Date('2026-10-12T10:00:00'));
    }
  });
});

describe('mock de extensões: limite vem do cadastro de Grupos', () => {
  it('o limite do pedido é o do grupo da pessoa, e muda quando o grupo muda', async () => {
    const { grupos, definirGrupoDaPessoa } = await import('../../../../mock/grupos');
    const { resumoDb } = await import('./db');
    // Ana está no grupo Comercial (10h).
    expect(resumoDb('u-ana', '2026-10')?.limiteMensalMin).toBe(600);
    // Mudar o limite do grupo em Configurações › Grupos reflete na extensão.
    const comercial = (await grupos.listar()).find((g) => g.nome === 'Comercial')!;
    await grupos.editar(comercial.id, { nome: comercial.nome, descricao: comercial.descricao, limiteHoras: 20 });
    expect(resumoDb('u-ana', '2026-10')?.limiteMensalMin).toBe(1200);
    // Grupo sem limite: null (a tela mostra "Sem limite de extensão").
    const operacoes = (await grupos.listar()).find((g) => g.nome === 'Operações')!;
    definirGrupoDaPessoa('u-ana', operacoes.id);
    expect(resumoDb('u-ana', '2026-10')?.limiteMensalMin).toBeNull();
    // Sem grupo: não há dado de limite e a seção some.
    definirGrupoDaPessoa('u-ana', null);
    expect(resumoDb('u-ana', '2026-10')).toBeNull();
  });

  it('o grupo do pedido é o nome do grupo do cadastro', async () => {
    const { listarDb } = await import('./db');
    entrarComo('carlos');
    const r = listarDb(new URLSearchParams('aba=aprovar&de=&ate='));
    if (r === 'proibido') throw new Error('proibido');
    expect(r.itens.find((p) => p.beneficiario.id === 'u-ana')?.grupo).toBe('Comercial');
  });
});
