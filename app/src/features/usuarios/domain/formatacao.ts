/** "2026-10-20" vira "20/10". Se o ano não for o de referência, vira "20/10/2027". */
export function dataCurta(iso: string, anoReferencia: string): string {
  const [ano, mes, dia] = iso.split('-');
  return ano === anoReferencia ? `${dia}/${mes}` : `${dia}/${mes}/${ano}`;
}

/** "10:00–16:00" */
export const faixaDeHoras = (entrada: string, saida: string) => `${entrada}–${saida}`;

/** "Olga Prado aprova no lugar de Carlos Mendes de 20/10 a 31/10" */
export function resumoSubstituto(substituto: string, titular: string, de: string, ate: string, anoReferencia: string): string {
  return `${substituto} aprova no lugar de ${titular} de ${dataCurta(de, anoReferencia)} a ${dataCurta(ate, anoReferencia)}`;
}
