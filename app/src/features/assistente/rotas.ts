/**
 * Conferência de rotas devolvidas pela IA. Usada no intermediário e no navegador.
 * Regra: só caminho interno do sistema, escrito de forma direta. Na dúvida, recusa.
 */

/**
 * Devolve o caminho (sem os filtros) se `rota` for um caminho interno simples; senão, null.
 * Recusa endereço com esquema (https:, javascript:), "//host", barra invertida, ".." e qualquer forma
 * que o navegador pudesse interpretar como outro site.
 */
export function caminhoInterno(rota: string): string | null {
  if (typeof rota !== 'string' || rota.length > 500) return null;
  // eslint-disable-next-line no-control-regex
  if (!rota.startsWith('/') || rota.startsWith('//') || /[\\\u0000-\u001f]/.test(rota)) return null;
  const bruto = rota.split(/[?#]/)[0];
  let url: URL;
  try {
    url = new URL(rota, 'http://scua.interno');
  } catch {
    return null;
  }
  // Se o navegador "arrumou" o caminho (.., barras duplas, codificação), não era um caminho direto.
  if (url.origin !== 'http://scua.interno' || url.pathname !== bruto) return null;
  return url.pathname;
}

/** A rota é interna e o caminho dela está entre os permitidos. */
export function rotaEntre(rota: string, caminhosPermitidos: Iterable<string>): boolean {
  const caminho = caminhoInterno(rota);
  if (caminho === null) return false;
  for (const p of caminhosPermitidos) if (p.split('?')[0] === caminho) return true;
  return false;
}
