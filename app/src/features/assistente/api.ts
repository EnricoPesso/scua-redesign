import type { MotivoDeErro, PedidoAssistente, RespostaAssistente } from './contrato';
import { responderSimulado } from './simulado';

/** Erro que a janela do assistente sabe explicar para a pessoa. */
export class ErroDoAssistente extends Error {
  readonly motivo: Exclude<MotivoDeErro, 'sem-chave'>;
  constructor(motivo: Exclude<MotivoDeErro, 'sem-chave'>) {
    super(motivo);
    this.name = 'ErroDoAssistente';
    this.motivo = motivo;
  }
}

/**
 * Nos testes (unidade e ponta a ponta) o assistente nunca fala com a rede:
 * o Vitest roda em modo "test" e o Playwright liga `__SCUA_IA_SIMULADO__` antes de a página carregar.
 */
export function forcarSimulado(): boolean {
  return import.meta.env.MODE === 'test' || (globalThis as { __SCUA_IA_SIMULADO__?: boolean }).__SCUA_IA_SIMULADO__ === true;
}

const MOTIVOS: MotivoDeErro[] = ['sem-chave', 'configuracao', 'chave-recusada', 'limite', 'indisponivel'];

/**
 * Pergunta ao assistente. Com IA configurada no servidor, a resposta vem dela;
 * sem chave (ou sem servidor, como no build publicado), vem do modo demonstração.
 */
export async function perguntar(pedido: PedidoAssistente, signal?: AbortSignal): Promise<RespostaAssistente> {
  if (forcarSimulado()) return responderSimulado(pedido);

  let r: Response;
  try {
    r = await fetch('/api/assistente', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pedido), signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ErroDoAssistente('indisponivel');
  }
  // 404: não existe intermediário (build sem servidor). Cai no modo demonstração.
  if (r.status === 404) return responderSimulado(pedido);

  let corpo: unknown;
  try {
    corpo = await r.json();
  } catch {
    // Resposta que não é JSON (ex.: página HTML do servidor estático): também é "sem intermediário".
    if (r.ok) return responderSimulado(pedido);
    throw new ErroDoAssistente('indisponivel');
  }
  if (r.ok) {
    const { texto, acoes } = corpo as Partial<RespostaAssistente>;
    return { texto: typeof texto === 'string' ? texto : '', acoes: Array.isArray(acoes) ? acoes : [] };
  }
  const motivo = (corpo as { motivo?: MotivoDeErro } | null)?.motivo;
  if (motivo === 'sem-chave') return responderSimulado(pedido);
  throw new ErroDoAssistente(motivo && MOTIVOS.includes(motivo) ? (motivo as Exclude<MotivoDeErro, 'sem-chave'>) : 'indisponivel');
}
