import { describe, expect, it, vi } from 'vitest';
import type { AlvoFormulario, AlvoRelatorio, PedidoAssistente } from '../contrato';
import { instrucoes } from './instrucoes';
import { configurado, responder } from './responder';

const pedido: PedidoAssistente = {
  mensagens: [{ papel: 'usuario', texto: 'me leva para ausências' }],
  contexto: { rota: '/inicio', pessoa: 'Carlos', hoje: '2026-10-12', telas: [{ titulo: 'Ausências', para: '/ausencias' }], formularios: [], alvo: null },
  ferramentas: ['navegar'],
};
const relatorio: AlvoRelatorio = { tipo: 'relatorio', titulo: 'Tempo de bloqueio', filtros: { Período: 'de 06/10 a 12/10' }, indicadores: [{ rotulo: 'Bloqueios liberados', valor: '4' }], colunas: ['Colaborador', 'Minutos'], linhas: [['Ana Souza', '30']], totalDeLinhas: 1 };
const formulario: AlvoFormulario = { tipo: 'formulario', id: 'cadastro:pausas', titulo: 'Pausa', campos: [{ chave: 'minutos', rotulo: 'Duração em minutos', tipo: 'numero', maximo: 60 }], valores: { minutos: 10 } };

const ok = (json: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(json), { status: 200 }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const corpoEnviado = (buscar: ReturnType<typeof vi.fn>) => JSON.parse((buscar.mock.calls[0] as any)[1].body);
const anthropic = { SCUA_IA_PROVEDOR: 'anthropic', SCUA_IA_CHAVE: 'k' };

describe('responder', () => {
  it('sem chave: 503 sem chamar a rede', async () => {
    const buscar = vi.fn();
    expect(await responder(pedido, {}, buscar)).toEqual({ ok: false, status: 503, motivo: 'sem-chave' });
    expect(await responder(pedido, { SCUA_IA_PROVEDOR: 'anthropic', SCUA_IA_CHAVE: '   ' }, buscar)).toMatchObject({ motivo: 'sem-chave' });
    expect(buscar).not.toHaveBeenCalled();
    expect(configurado({})).toBe(false);
    expect(configurado(anthropic)).toBe(true);
  });

  it('anthropic: chama a API com o modelo padrão e devolve texto e ações', async () => {
    const buscar = ok({ content: [{ type: 'tool_use', name: 'navegar', input: { rota: '/ausencias' } }] });
    const r = await responder(pedido, anthropic, buscar);
    expect(r).toEqual({ ok: true, resposta: { texto: '', acoes: [{ tipo: 'navegar', rota: '/ausencias' }] } });
    expect(corpoEnviado(buscar).model).toBe('claude-haiku-5-5');
  });

  it('relatório aberto usa o modelo de análise', async () => {
    const comRelatorio = { ...pedido, contexto: { ...pedido.contexto, alvo: relatorio } };
    let buscar = ok({ content: [{ type: 'text', text: 'Resumo.' }] });
    await responder(comRelatorio, anthropic, buscar);
    expect(corpoEnviado(buscar).model).toBe('claude-sonnet-5-5');
    buscar = ok({ content: [] });
    await responder(comRelatorio, { ...anthropic, SCUA_IA_MODELO_ANALISE: 'x' }, buscar);
    expect(corpoEnviado(buscar).model).toBe('x');
    // OpenAI sem modelo de análise: usa o modelo padrão configurado.
    buscar = ok({ choices: [] });
    await responder(comRelatorio, { SCUA_IA_PROVEDOR: 'openai', SCUA_IA_CHAVE: 'k', SCUA_IA_MODELO: 'leve' }, buscar);
    expect(corpoEnviado(buscar).model).toBe('leve');
  });

  it.each([[401, 'chave-recusada'], [403, 'chave-recusada'], [429, 'limite'], [500, 'indisponivel']] as const)('HTTP %i do provedor vira %s, sem repassar o corpo', async (status, motivo) => {
    const buscar = vi.fn().mockResolvedValue(new Response('{"error":"sk-segredo vazou"}', { status }));
    const r = await responder(pedido, { SCUA_IA_PROVEDOR: 'openai', SCUA_IA_CHAVE: 'k', SCUA_IA_MODELO: 'm' }, buscar);
    expect(r).toMatchObject({ ok: false, motivo });
    expect(JSON.stringify(r)).not.toContain('segredo');
  });

  it('falha de rede e resposta que não é JSON viram indisponivel', async () => {
    expect(await responder(pedido, anthropic, vi.fn().mockRejectedValue(new Error('ECONNRESET k')))).toEqual({ ok: false, status: 502, motivo: 'indisponivel' });
    expect(await responder(pedido, anthropic, vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })))).toEqual({ ok: false, status: 502, motivo: 'indisponivel' });
  });

  it('provedor desconhecido, e openai ou gemini sem modelo, são erro de configuração', async () => {
    const buscar = vi.fn();
    expect(await responder(pedido, { SCUA_IA_PROVEDOR: 'outro', SCUA_IA_CHAVE: 'k' }, buscar)).toEqual({ ok: false, status: 500, motivo: 'configuracao' });
    expect(await responder(pedido, { SCUA_IA_PROVEDOR: 'openai', SCUA_IA_CHAVE: 'k' }, buscar)).toMatchObject({ motivo: 'configuracao' });
    expect(await responder(pedido, { SCUA_IA_PROVEDOR: 'gemini', SCUA_IA_CHAVE: 'k' }, buscar)).toMatchObject({ motivo: 'configuracao' });
    expect(buscar).not.toHaveBeenCalled();
  });

  it('ação de ferramenta não oferecida é descartada', async () => {
    const buscar = ok({ content: [{ type: 'text', text: 'Feito.' }, { type: 'tool_use', name: 'preencher_formulario', input: { campos: { nome: 'X' } } }] });
    const r = await responder(pedido, anthropic, buscar);
    expect(r).toEqual({ ok: true, resposta: { texto: 'Feito.', acoes: [] } });
    // E a ferramenta não oferecida nem foi enviada ao provedor.
    expect(corpoEnviado(buscar).tools.map((t: { name: string }) => t.name)).toEqual(['navegar']);
  });

  it('rota externa, com esquema ou fora das telas da pessoa é descartada; formulário fora da lista também', async () => {
    const comForm = { ...pedido, ferramentas: ['navegar', 'abrir_formulario'] as PedidoAssistente['ferramentas'], contexto: { ...pedido.contexto, formularios: [{ id: 'jornada', titulo: 'Jornada de trabalho' }] } };
    const usos = ['https://exemplo.com/x', '//exemplo.com', 'javascript:alert(1)', '/\\exemplo.com', '/ausencias\\..\\auditoria','ausencias', '/auditoria', '/ausencias/../auditoria'].map((rota) => ({ type: 'tool_use', name: 'navegar', input: { rota } }));
    const buscar = ok({ content: [...usos,
      { type: 'tool_use', name: 'navegar', input: { rota: '/ausencias?de=2026-10-11&ate=2026-10-11' } },
      { type: 'tool_use', name: 'abrir_formulario', input: { formulario: 'usuario' } },
      { type: 'tool_use', name: 'abrir_formulario', input: { formulario: 'jornada' } },
    ] });
    const r = await responder(comForm, anthropic, buscar);
    expect(r).toMatchObject({ ok: true, resposta: { acoes: [{ tipo: 'navegar', rota: '/ausencias?de=2026-10-11&ate=2026-10-11' }, { tipo: 'abrir_formulario', formulario: 'jornada' }] } });
  });

  it('pedido com a forma errada é recusado sem chamar a rede', async () => {
    const buscar = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await responder({ mensagens: [] } as any, anthropic, buscar)).toEqual({ ok: false, status: 400, motivo: 'configuracao' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await responder({ ...pedido, ferramentas: ['apagar_tudo'] } as any, anthropic, buscar)).toMatchObject({ status: 400 });
    expect(buscar).not.toHaveBeenCalled();
  });
});

describe('instrucoes', () => {
  it('incluem as telas, a pessoa, a data e as regras fixas', () => {
    const t = instrucoes(pedido.contexto);
    expect(t).toContain('/ausencias');
    expect(t).toContain('Carlos');
    expect(t).toContain('2026-10-12');
    expect(t).toMatch(/Scua Logon/);
    expect(t).toMatch(/nunca invente/i);
  });

  it('com formulário aberto, listam chave, rótulo, limites e valor atual de cada campo', () => {
    const t = instrucoes({ ...pedido.contexto, alvo: formulario });
    expect(t).toContain('minutos');
    expect(t).toContain('Duração em minutos');
    expect(t).toContain('60');
    expect(t).toContain('Pausa');
  });

  it('com relatório aberto, levam indicadores, linhas e o total', () => {
    const t = instrucoes({ ...pedido.contexto, alvo: relatorio });
    expect(t).toContain('Tempo de bloqueio');
    expect(t).toContain('Bloqueios liberados: 4');
    expect(t).toContain('Ana Souza');
    expect(t).toContain('1 linha');
  });
});
