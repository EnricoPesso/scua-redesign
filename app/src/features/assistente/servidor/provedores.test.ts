import { describe, expect, it } from 'vitest';
import type { Mensagem, NomeFerramenta } from '../contrato';
import { lerResposta, montarChamada } from './provedores';

const mensagens: Mensagem[] = [{ papel: 'usuario', texto: 'oi' }, { papel: 'assistente', texto: 'olá' }];
const base = { chave: 'k-teste', modelo: 'm', sistema: 'S', mensagens, ferramentas: ['navegar'] as NomeFerramenta[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const corpo = (c: { body: unknown }) => c.body as any;

describe('anthropic', () => {
  it('url, cabeçalhos, sistema, papéis e ferramenta', () => {
    const c = montarChamada({ ...base, provedor: 'anthropic' });
    expect(c.url).toBe('https://api.anthropic.com/v1/messages');
    expect(c.headers).toMatchObject({ 'x-api-key': 'k-teste', 'anthropic-version': '2023-06-01' });
    expect(c.body).toMatchObject({ model: 'm', system: 'S', messages: [{ role: 'user', content: 'oi' }, { role: 'assistant', content: 'olá' }] });
    expect(corpo(c).max_tokens).toBe(2048);
    expect(corpo(c).tools).toHaveLength(1);
    expect(corpo(c).tools[0]).toMatchObject({ name: 'navegar', input_schema: { type: 'object' } });
  });

  it('lê texto e tool_use', () => {
    expect(lerResposta('anthropic', { content: [{ type: 'text', text: 'Indo.' }, { type: 'tool_use', name: 'navegar', input: { rota: '/ausencias' } }] }))
      .toEqual({ texto: 'Indo.', acoes: [{ tipo: 'navegar', rota: '/ausencias' }] });
  });
});

describe('openai', () => {
  it('autorização, mensagem de sistema e ferramenta como função', () => {
    const c = montarChamada({ ...base, provedor: 'openai' });
    expect(c.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(c.headers).toMatchObject({ Authorization: 'Bearer k-teste' });
    expect(corpo(c).messages[0]).toEqual({ role: 'system', content: 'S' });
    expect(corpo(c).messages[2]).toEqual({ role: 'assistant', content: 'olá' });
    expect(corpo(c).tools[0]).toMatchObject({ type: 'function', function: { name: 'navegar', parameters: { type: 'object' } } });
  });

  it('lê tool_calls com argumentos em texto JSON', () => {
    const json = { choices: [{ message: { content: null, tool_calls: [{ function: { name: 'preencher_formulario', arguments: '{"campos":{"nome":"X"}}' } }] } }] };
    expect(lerResposta('openai', json)).toEqual({ texto: '', acoes: [{ tipo: 'preencher', campos: { nome: 'X' } }] });
  });

  it('argumentos com JSON inválido e ferramenta desconhecida são ignorados', () => {
    const r = lerResposta('openai', { choices: [{ message: { content: 'ok', tool_calls: [{ function: { name: 'navegar', arguments: '{rota' } }, { function: { name: 'apagar_tudo', arguments: '{}' } }] } }] });
    expect(r).toEqual({ texto: 'ok', acoes: [] });
  });
});

describe('gemini', () => {
  it('url com o modelo, chave no cabeçalho, papel "model" e declaração de função', () => {
    const c = montarChamada({ ...base, provedor: 'gemini' });
    expect(c.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/m:generateContent');
    expect(c.url).not.toContain('k-teste');
    expect(c.headers).toMatchObject({ 'x-goog-api-key': 'k-teste' });
    expect(corpo(c).systemInstruction).toEqual({ parts: [{ text: 'S' }] });
    expect(corpo(c).contents[1]).toEqual({ role: 'model', parts: [{ text: 'olá' }] });
    expect(corpo(c).tools[0].functionDeclarations[0]).toMatchObject({ name: 'navegar', parameters: { type: 'object' } });
  });

  it('lê texto e functionCall', () => {
    const json = { candidates: [{ content: { parts: [{ text: 'Abrindo.' }, { functionCall: { name: 'abrir_formulario', args: { formulario: 'jornada' } } }] } }] };
    expect(lerResposta('gemini', json)).toEqual({ texto: 'Abrindo.', acoes: [{ tipo: 'abrir_formulario', formulario: 'jornada' }] });
  });
});

describe('qualquer provedor', () => {
  it.each(['anthropic', 'openai', 'gemini'] as const)('%s: resposta malformada não quebra', (p) => {
    expect(lerResposta(p, { qualquer: 'coisa' })).toEqual({ texto: '', acoes: [] });
    expect(lerResposta(p, null)).toEqual({ texto: '', acoes: [] });
    expect(lerResposta(p, 'texto solto')).toEqual({ texto: '', acoes: [] });
  });

  it.each(['anthropic', 'openai', 'gemini'] as const)('%s: sem ferramentas, não manda o campo tools', (p) => {
    expect(montarChamada({ ...base, provedor: p, ferramentas: [] }).body).not.toHaveProperty('tools');
  });

  it('ação com a forma errada é descartada (campos que não é objeto, rota que não é texto)', () => {
    const r = lerResposta('anthropic', { content: [
      { type: 'tool_use', name: 'preencher_formulario', input: { campos: 'tudo' } },
      { type: 'tool_use', name: 'preencher_formulario', input: { campos: ['a'] } },
      { type: 'tool_use', name: 'navegar', input: { rota: 42 } },
      { type: 'tool_use', name: 'abrir_formulario', input: {} },
    ] });
    expect(r.acoes).toEqual([]);
  });
});
