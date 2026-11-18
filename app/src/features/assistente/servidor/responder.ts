import { PROVEDORES, type Acao, type Mensagem, type MotivoDeErro, type NomeFerramenta, type PedidoAssistente, type Provedor, type RespostaAssistente } from '../contrato.ts';
import { FERRAMENTAS } from '../ferramentas.ts';
import { rotaEntre } from '../rotas.ts';
import { instrucoes } from './instrucoes.ts';
import { lerResposta, montarChamada } from './provedores.ts';

/**
 * Recebe o pedido do navegador, chama o provedor de IA com a chave do servidor e devolve texto + ações.
 * A chave e o texto de erro do provedor nunca saem daqui.
 */

export interface EnvIA {
  SCUA_IA_PROVEDOR?: string;
  SCUA_IA_CHAVE?: string;
  SCUA_IA_MODELO?: string;
  SCUA_IA_MODELO_ANALISE?: string;
}

export type Resultado =
  | { ok: true; resposta: RespostaAssistente }
  | { ok: false; status: number; motivo: MotivoDeErro };

/** Só o Claude tem modelo padrão; para os outros o nome vem da configuração. */
const PADRAO: Partial<Record<Provedor, { modelo: string; analise: string }>> = {
  anthropic: { modelo: 'claude-haiku-5-5', analise: 'claude-sonnet-5-5' },
};

const TEMPO_LIMITE_MS = 60_000;
const MAXIMO_DE_MENSAGENS = 20;
const FERRAMENTA_DA_ACAO: Record<Acao['tipo'], NomeFerramenta> = { preencher: 'preencher_formulario', navegar: 'navegar', abrir_formulario: 'abrir_formulario' };

const limpo = (v: string | undefined) => (v ?? '').trim();
const erro = (status: number, motivo: MotivoDeErro): Resultado => ({ ok: false, status, motivo });

export function configurado(env: EnvIA): boolean {
  return limpo(env.SCUA_IA_CHAVE) !== '';
}

export function provedorDe(env: EnvIA): Provedor | null {
  const p = limpo(env.SCUA_IA_PROVEDOR).toLowerCase() || 'anthropic';
  return (PROVEDORES as string[]).includes(p) ? (p as Provedor) : null;
}

function pedidoValido(p: unknown): p is PedidoAssistente {
  if (typeof p !== 'object' || p === null) return false;
  const { mensagens, contexto, ferramentas } = p as Partial<PedidoAssistente>;
  const mensagensOk = Array.isArray(mensagens) && mensagens.length > 0
    && mensagens.every((m: Mensagem) => m && (m.papel === 'usuario' || m.papel === 'assistente') && typeof m.texto === 'string');
  const contextoOk = typeof contexto === 'object' && contexto !== null && Array.isArray(contexto.telas) && Array.isArray(contexto.formularios);
  const ferramentasOk = Array.isArray(ferramentas) && ferramentas.every((f) => Object.hasOwn(FERRAMENTAS, f));
  return mensagensOk && contextoOk && ferramentasOk;
}

export async function responder(pedido: PedidoAssistente, env: EnvIA, buscar: typeof fetch): Promise<Resultado> {
  if (!configurado(env)) return erro(503, 'sem-chave');
  if (!pedidoValido(pedido)) return erro(400, 'configuracao');

  const provedor = provedorDe(env);
  if (!provedor) return erro(500, 'configuracao');
  const padrao = PADRAO[provedor];
  const modeloBase = limpo(env.SCUA_IA_MODELO) || padrao?.modelo || '';
  if (!modeloBase) return erro(500, 'configuracao');
  const analisando = pedido.contexto.alvo?.tipo === 'relatorio';
  const modelo = analisando ? limpo(env.SCUA_IA_MODELO_ANALISE) || (limpo(env.SCUA_IA_MODELO) ? modeloBase : padrao?.analise ?? modeloBase) : modeloBase;

  const chamada = montarChamada({
    provedor,
    chave: limpo(env.SCUA_IA_CHAVE),
    modelo,
    sistema: instrucoes(pedido.contexto),
    // Começa sempre por uma mensagem da pessoa (exigência dos provedores) e não cresce sem limite.
    mensagens: pedido.mensagens.slice(-MAXIMO_DE_MENSAGENS).filter((m, i, todas) => i > 0 || m.papel === 'usuario' || todas.length === 1),
    ferramentas: pedido.ferramentas,
  });

  let json: unknown;
  try {
    const r = await buscar(chamada.url, { method: 'POST', headers: chamada.headers, body: JSON.stringify(chamada.body), signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
    if (r.status === 401 || r.status === 403) return erro(502, 'chave-recusada');
    if (r.status === 429) return erro(429, 'limite');
    if (!r.ok) return erro(502, 'indisponivel');
    json = await r.json();
  } catch {
    // Rede, tempo esgotado ou corpo que não é JSON. O detalhe não é repassado (pode conter a chave ou dados).
    return erro(502, 'indisponivel');
  }

  const lida = lerResposta(provedor, json);
  // O que a IA devolve é conferido antes de sair daqui (e de novo no navegador): só ferramenta oferecida,
  // só rota interna de uma tela da pessoa, só formulário da lista dela.
  const telas = pedido.contexto.telas.map((t) => t.para);
  const formularios = new Set(pedido.contexto.formularios.map((f) => f.id));
  const acoes = lida.acoes.filter((a) => {
    if (!pedido.ferramentas.includes(FERRAMENTA_DA_ACAO[a.tipo])) return false;
    if (a.tipo === 'navegar') return rotaEntre(a.rota, telas);
    if (a.tipo === 'abrir_formulario') return formularios.has(a.formulario);
    return true;
  });
  return { ok: true, resposta: { texto: lida.texto, acoes } };
}
