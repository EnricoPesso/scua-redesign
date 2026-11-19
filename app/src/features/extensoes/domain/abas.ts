import type { Aba, Permissoes } from './types';

export const ORDEM_ABAS: Aba[] = ['aprovar', 'meus', 'todos'];

export const ROTULO_ABA: Record<Aba, string> = { aprovar: 'Para aprovar', meus: 'Meus pedidos', todos: 'Todos' };

/** Abas que a pessoa vê, na ordem da spec. A primeira é a aba inicial. */
export function abasPermitidas(p: Permissoes): Aba[] {
  return ORDEM_ABAS.filter((aba) => (aba === 'aprovar' ? p.podeAprovar : aba === 'meus' ? p.podePedir : p.podeVerTodos));
}

export function ehAba(valor: string | undefined): valor is Aba {
  return valor === 'aprovar' || valor === 'meus' || valor === 'todos';
}
