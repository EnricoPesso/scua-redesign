import { ApiError } from '../domain/erros';

/** Chama /api<caminho>. Erros viram ApiError; o detalhe técnico vai só para o console. */
export async function request<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(new URL(`/api${caminho}`, window.location.origin), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (e) {
    console.error('[extensoes] falha de rede', e);
    throw new ApiError(0, 'REDE');
  }
  if (!resposta.ok) {
    let corpo: { codigo?: string; dados?: Record<string, string> } = {};
    try {
      corpo = await resposta.json();
    } catch {
      // corpo vazio ou não-JSON
    }
    console.error('[extensoes] erro da API', resposta.status, corpo);
    throw new ApiError(resposta.status, corpo.codigo ?? 'DESCONHECIDO', corpo.dados ?? {});
  }
  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}
