/**
 * O que a pessoa pede em palavras comuns e o app resolve sozinho, sem perguntar à IA:
 * o resumo do dia e a aprovação em lote. O app decide (e não o modelo) porque aprovar grava dados:
 * o pedido sempre passa pelo cartão de confirmação.
 */

export type Intencao = 'resumo' | 'aprovar-lote' | 'reprovar';

/** Minúsculas e sem acento. */
const simples = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const RESUMO = [
  /\bresumo do dia\b/,
  /\bo que (eu )?(preciso|tenho|precisa|tem|devo)\b.*\b(de mim|para hoje|pra hoje|hoje|fazer)\b/,
  /\bo que (ha|tem|existe) (para|pra) (mim|hoje)\b/,
  /\bminhas pendencias\b/,
  /\bpendencias (de|para|pra) hoje\b/,
];
const DUVIDA = /^\s*(como|onde|qual|quais|quando|por que|porque|o que e)\b/;
const VERBO_APROVAR = /\baprov(ar|a|e|em)\b/;
const VERBO_REPROVAR = /\b(reprov(ar|a|e|em)|recus(ar|a|e)|negar|exclu(ir|a|i)|apag(ar|ue|a)|delet(ar|e))\b/;
const DE_PEDIDOS = /\b(pedidos|extensoes|lote|limite|todos|pendentes)\b/;

export function entenderPedido(texto: string): Intencao | null {
  const t = simples(texto);
  if (RESUMO.some((re) => re.test(t))) return 'resumo';
  if (DUVIDA.test(t)) return null;
  if (VERBO_REPROVAR.test(t) && /\b(pedidos?|extensoes?)\b/.test(t)) return 'reprovar';
  if (VERBO_APROVAR.test(t) && DE_PEDIDOS.test(t)) return 'aprovar-lote';
  return null;
}
