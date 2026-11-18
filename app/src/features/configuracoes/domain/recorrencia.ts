/** Resumo legível de uma regra de recorrência: "5 vezes em 2 h". */
export function resumoRecorrencia(r: { minimo: number; janelaHoras: number }): string {
  return `${r.minimo} vezes em ${r.janelaHoras} h`;
}
