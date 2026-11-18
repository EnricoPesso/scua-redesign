export interface Grupo { grupo: string; total: number }

/** Conta as linhas por grupo: maior total primeiro, empate em ordem alfabética. */
export function agruparPor<T>(rows: T[], chave: (row: T) => string): Grupo[] {
  const contagem = new Map<string, number>();
  for (const r of rows) {
    const g = chave(r);
    contagem.set(g, (contagem.get(g) ?? 0) + 1);
  }
  return [...contagem].map(([grupo, total]) => ({ grupo, total })).sort((a, b) => b.total - a.total || a.grupo.localeCompare(b.grupo, 'pt-BR'));
}

/** Participação de cada grupo no total, em % com uma casa (0 quando não há total). */
export function participacao(total: number, soma: number): number {
  return soma === 0 ? 0 : Math.round((total / soma) * 1000) / 10;
}
