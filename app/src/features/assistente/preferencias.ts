import type { Provedor } from './contrato';

/**
 * Preferências do assistente.
 * - Da empresa (administrador): ligado/desligado, de quem é a chave, se a aprovação automática é permitida.
 *   Nesta versão fica em memória, como os outros dados de exemplo; no sistema real vem da API.
 *   A chave de API nunca passa por aqui.
 * - Da pessoa: aprovação automática, guardada no navegador.
 */

export interface ConfigAssistente {
  ativo: boolean;
  origemDaChave: 'scua' | 'propria';
  provedor: Provedor;
  permitirAutomatica: boolean;
}

const PADRAO: ConfigAssistente = { ativo: true, origemDaChave: 'scua', provedor: 'anthropic', permitirAutomatica: true };

let config: ConfigAssistente = { ...PADRAO };
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((o) => o());

export const lerConfig = (): ConfigAssistente => config;
export function salvarConfig(nova: ConfigAssistente): void { config = { ...nova }; avisar(); }
export function resetarConfigAssistente(): void { config = { ...PADRAO }; avisar(); }
/** Para a tela reagir quando o administrador muda a configuração (useSyncExternalStore). */
export function assinarConfig(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => { ouvintes.delete(ouvinte); };
}

const chaveAutomatica = (usuarioId: string) => `scua.assistente.auto.${usuarioId}`;

export function lerAutomatica(usuarioId: string): boolean {
  try {
    return window.localStorage.getItem(chaveAutomatica(usuarioId)) === '1';
  } catch {
    return false;
  }
}

export function salvarAutomatica(usuarioId: string, ligada: boolean): void {
  try {
    if (ligada) window.localStorage.setItem(chaveAutomatica(usuarioId), '1');
    else window.localStorage.removeItem(chaveAutomatica(usuarioId));
  } catch {
    // sem localStorage (modo privado): vale só nesta sessão, pelo estado da tela
  }
}
