import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/server';
import { extensoesApi } from './extensoesApi';
import { decidirExterno, entrarComo } from './mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const FILA = { aba: 'aprovar' as const, de: '', ate: '', pagina: 1, tamanho: 25 };

describe('extensoesApi (contra o mock)', () => {
  it('fila do gestor: mais antigo primeiro, inclui pendente de setembro', async () => {
    const r = await extensoesApi.listar(FILA);
    expect(r.itens.map((p) => p.id)).toEqual(['p-8', 'p-2', 'p-1', 'p-3', 'p-4']);
    expect(r.total).toBe(5);
    expect(r.itens[0].historico).toBeUndefined();
  });

  it('totais do RH no mês somam minutos aprovados', async () => {
    entrarComo('renata');
    await expect(extensoesApi.totais({ aba: 'todos', de: '2026-10-01', ate: '2026-10-31' })).resolves.toEqual({ pendentes: 5, minutosAprovados: 360, reprovados: 1 });
  });

  it('decidir pedido já decidido devolve JA_DECIDIDO com os dados', async () => {
    await expect(extensoesApi.decidir('p-5', { acao: 'aprovar' })).rejects.toMatchObject({
      status: 409, codigo: 'JA_DECIDIDO', dados: { status: 'aprovado', por: 'Carlos Mendes', canal: 'painel' },
    });
  });

  it('pedido sobreposto a um pendente devolve PERIODO_CONFLITANTE', async () => {
    const novo = { beneficiarioId: 'u-ana', dataInicial: '2026-10-14', dataFinal: '2026-10-14', horario: { inicio: '18:00', fim: '19:00' }, justificativaCodigo: '3', detalhes: '' };
    await expect(extensoesApi.criar(novo)).rejects.toMatchObject({ status: 409, codigo: 'PERIODO_CONFLITANTE' });
  });

  it('resumo devolve null quando a pessoa não tem o dado (404)', async () => {
    await expect(extensoesApi.resumo('u-desconhecido', '2026-10')).resolves.toBeNull();
  });

  it('resumo devolve null quando a API não implementa (501)', async () => {
    server.use(http.get('*/api/beneficiarios/:id/resumo', () => new HttpResponse(null, { status: 501 })));
    await expect(extensoesApi.resumo('u-ana', '2026-10')).resolves.toBeNull();
  });

  it('resumo de quem tem limite 0', async () => {
    await expect(extensoesApi.resumo('u-rui', '2026-10')).resolves.toEqual({ minutosAprovadosNoMes: 0, limiteMensalMin: 0, aprovador: { id: 'u-carlos', nome: 'Carlos Mendes' } });
  });

  it('lote informa sucesso e falha de cada pedido', async () => {
    decidirExterno('p-2', 'aprovado', 'whatsapp');
    const r = await extensoesApi.decidirEmLote(['p-1', 'p-2'], { acao: 'aprovar' });
    expect(r.sucesso).toEqual(['p-1']);
    expect(r.falhas).toEqual([{ id: 'p-2', nome: 'João Lima', motivo: 'já tinha sido aprovado por Carlos Mendes via WhatsApp às 10:00' }]);
  });

  it('link de exportação leva os filtros', () => {
    expect(extensoesApi.exportarUrl({ aba: 'todos', de: '2026-10-01', ate: '2026-10-31' })).toBe('/api/extensoes/exportar?aba=todos&de=2026-10-01&ate=2026-10-31');
  });
});
