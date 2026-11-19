/** Números das variáveis {{1}}, {{2}}… usadas no texto, na ordem em que aparecem (sem repetir). */
export function variaveisDoTexto(texto: string): number[] {
  const achadas = [...texto.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return [...new Set(achadas)];
}

/** A Meta exige variáveis numeradas em sequência a partir de 1. */
export function validarVariaveis(texto: string): string | undefined {
  const nums = variaveisDoTexto(texto).sort((a, b) => a - b);
  if (nums.some((n, i) => n !== i + 1)) return 'Numere as variáveis em sequência, a partir de {{1}}';
  return undefined;
}
