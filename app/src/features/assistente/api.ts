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
 * Existe um servidor para perguntar? No desenvolvimento, sim (o intermediário do Vite).
 * No pacote publicado só quando o back-end real existir (VITE_ASSISTENTE_API=1); sem isso, modo demonstração,
 * sem pedir nada à rede (um 404 apareceria como erro no console).
 */
const temServidor = (): boolean => import.meta.env.DEV || import.meta.env.VITE_ASSISTENTE_API === '1';

/**
 * Pergunta ao servidor. Devolve `null` quando não há IA conectada (sem chave): quem chamou usa o modo demonstração.
 * Primeiro consulta o estado (resposta 200 nos dois casos), para a falta de chave não virar erro no console.
 */
export async function perguntarNoServidor(pedido: PedidoAssistente, buscar: typeof fetch, signal?: AbortSignal): Promise<RespostaAssistente | null> {
  let r: Response;
  try {
    const estado = await buscar('/api/assistente/estado', { signal });
    const { ativo } = (estado.ok ? await estado.json() : { ativo: false }) as { ativo?: boolean };
    if (!ativo) return null;
    r = await buscar('/api/assistente', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pedido), signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ErroDoAssistente('indisponivel');
  }

  let corpo: unknown;
  try {
    corpo = await r.json();
  } catch {
    throw new ErroDoAssistente('indisponivel');
  }
  if (r.ok) {
    const { texto, acoes } = (corpo ?? {}) as Partial<RespostaAssistente>;
    return { texto: typeof texto === 'string' ? texto : '', acoes: Array.isArray(acoes) ? acoes : [] };
  }
  const motivo = (corpo as { motivo?: MotivoDeErro } | null)?.motivo;
  // A chave foi tirada entre a consulta e o pedido.
  if (motivo === 'sem-chave') return null;
  throw new ErroDoAssistente(motivo && MOTIVOS.includes(motivo) ? (motivo as Exclude<MotivoDeErro, 'sem-chave'>) : 'indisponivel');
}

/**
 * Pergunta ao assistente. Com IA configurada no servidor, a resposta vem dela;
 * sem chave (ou sem servidor, como no pacote publicado), vem do modo demonstração.
 */
export async function perguntar(pedido: PedidoAssistente, signal?: AbortSignal): Promise<RespostaAssistente> {
  if (forcarSimulado() || !temServidor()) return responderSimulado(pedido);
  return (await perguntarNoServidor(pedido, fetch, signal)) ?? responderSimulado(pedido);
}
