import type { Acao, Mensagem, NomeFerramenta, Provedor } from '../contrato.ts';
import { FERRAMENTAS } from '../ferramentas.ts';

/**
 * Tradução do pedido do assistente para a API de cada provedor, e da resposta de volta.
 * Funções puras (sem rede): quem chama a rede é `responder.ts`.
 */

export interface Chamada { url: string; headers: Record<string, string>; body: unknown }

export interface EntradaProvedor {
  provedor: Provedor;
  chave: string;
  modelo: string;
  sistema: string;
  mensagens: Mensagem[];
  ferramentas: NomeFerramenta[];
}

const MAXIMO_DE_TOKENS = 2048;
const JSON_HEADERS = { 'content-type': 'application/json' };

export function montarChamada(e: EntradaProvedor): Chamada {
  const tem = e.ferramentas.length > 0;
  if (e.provedor === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: { ...JSON_HEADERS, 'x-api-key': e.chave, 'anthropic-version': '2023-06-01' },
      body: {
        model: e.modelo,
        max_tokens: MAXIMO_DE_TOKENS,
        system: e.sistema,
        messages: e.mensagens.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'assistant', content: m.texto })),
        ...(tem && { tools: e.ferramentas.map((n) => ({ name: n, description: FERRAMENTAS[n].descricao, input_schema: FERRAMENTAS[n].parametros })) }),
      },
    };
  }
  if (e.provedor === 'openai') {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${e.chave}` },
      body: {
        model: e.modelo,
        messages: [
          { role: 'system', content: e.sistema },
          ...e.mensagens.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'assistant', content: m.texto })),
        ],
        ...(tem && { tools: e.ferramentas.map((n) => ({ type: 'function', function: { name: n, description: FERRAMENTAS[n].descricao, parameters: FERRAMENTAS[n].parametros } })) }),
      },
    };
  }
  return {
    // A chave vai no cabeçalho, nunca na URL (URLs acabam em logs).
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(e.modelo)}:generateContent`,
    headers: { ...JSON_HEADERS, 'x-goog-api-key': e.chave },
    body: {
      systemInstruction: { parts: [{ text: e.sistema }] },
      contents: e.mensagens.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'model', parts: [{ text: m.texto }] })),
      ...(tem && { tools: [{ functionDeclarations: e.ferramentas.map((n) => ({ name: n, description: FERRAMENTAS[n].descricao, parameters: FERRAMENTAS[n].parametros })) }] }),
    },
  };
}

type Objeto = Record<string, unknown>;
const ehObjeto = (v: unknown): v is Objeto => typeof v === 'object' && v !== null && !Array.isArray(v);
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Chamada de ferramenta → ação do contrato. Nome desconhecido ou argumentos com a forma errada: descarta. */
function acaoDe(nome: unknown, argumentos: unknown): Acao | null {
  if (!ehObjeto(argumentos)) return null;
  if (nome === 'preencher_formulario' && ehObjeto(argumentos.campos)) return { tipo: 'preencher', campos: argumentos.campos };
  if (nome === 'navegar' && typeof argumentos.rota === 'string') return { tipo: 'navegar', rota: argumentos.rota };
  if (nome === 'abrir_formulario' && typeof argumentos.formulario === 'string') return { tipo: 'abrir_formulario', formulario: argumentos.formulario };
  return null;
}

function jsonOuNulo(texto: unknown): unknown {
  if (typeof texto !== 'string') return texto;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export function lerResposta(provedor: Provedor, json: unknown): { texto: string; acoes: Acao[] } {
  const textos: string[] = [];
  const acoes: Acao[] = [];
  const guardar = (a: Acao | null) => { if (a) acoes.push(a); };
  const raiz = ehObjeto(json) ? json : {};

  if (provedor === 'anthropic') {
    for (const bloco of lista(raiz.content)) {
      if (!ehObjeto(bloco)) continue;
      if (bloco.type === 'text' && typeof bloco.text === 'string') textos.push(bloco.text);
      if (bloco.type === 'tool_use') guardar(acaoDe(bloco.name, bloco.input));
    }
  } else if (provedor === 'openai') {
    const escolha = lista(raiz.choices)[0];
    const mensagem = ehObjeto(escolha) && ehObjeto(escolha.message) ? escolha.message : {};
    if (typeof mensagem.content === 'string') textos.push(mensagem.content);
    for (const chamada of lista(mensagem.tool_calls)) {
      const funcao = ehObjeto(chamada) && ehObjeto(chamada.function) ? chamada.function : null;
      if (funcao) guardar(acaoDe(funcao.name, jsonOuNulo(funcao.arguments)));
    }
  } else {
    const candidato = lista(raiz.candidates)[0];
    const conteudo = ehObjeto(candidato) && ehObjeto(candidato.content) ? candidato.content : {};
    for (const parte of lista(conteudo.parts)) {
      if (!ehObjeto(parte)) continue;
      if (typeof parte.text === 'string') textos.push(parte.text);
      if (ehObjeto(parte.functionCall)) guardar(acaoDe(parte.functionCall.name, parte.functionCall.args));
    }
  }
  return { texto: textos.join('\n').trim(), acoes };
}
