/**
 * Camada de dados simulada das telas que ainda não têm contrato de API com a Scua.
 * Cada feature tem um `api.ts` com funções assíncronas; quando a API real existir, só esse arquivo muda.
 */

/** Erro de comunicação simulado. A tela nunca mostra a mensagem dele: usa `mensagemDeErro`. */
export class ErroDeRede extends Error {
  constructor() {
    super('Falha de rede simulada');
    this.name = 'ErroDeRede';
  }
}

let falhando = false;
/** Ligado por `window.__scuaMock.simularFalha(true)`: todas as chamadas passam a falhar. */
export function definirFalhaDeRede(ligado: boolean): void { falhando = ligado; }

const ATRASO_MS = import.meta.env.MODE === 'test' ? 0 : 250;

/** Executa `fn` como se fosse uma chamada de rede: com atraso e sujeita à falha simulada. */
export function rede<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (falhando) {
        reject(new ErroDeRede());
        return;
      }
      try {
        resolve(structuredClone(fn()));
      } catch (e) {
        reject(e);
      }
    }, ATRASO_MS);
  });
}

/** Igual a `rede`, mas cancelável (para o `buscar` do modelo de relatório). */
export function redeCancelavel<T>(fn: () => T, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      if (falhando) {
        reject(new ErroDeRede());
        return;
      }
      try {
        resolve(structuredClone(fn()));
      } catch (e) {
        // Sem isto a promessa nunca terminaria e o relatório ficaria "carregando" para sempre.
        reject(e);
      }
    }, ATRASO_MS);
    signal.addEventListener('abort', () => clearTimeout(id), { once: true });
  });
}
