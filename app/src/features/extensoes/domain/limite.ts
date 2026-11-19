export type Faixa = 'ok' | 'atencao' | 'excedido' | 'sem-limite';

export interface AvaliacaoLimite {
  faixa: Faixa;
  /** Já usado + este pedido, em minutos. */
  totalMin: number;
  excessoMin: number;
  /** Sem teto (pode passar de 100). null quando não há limite. */
  percentual: number | null;
}

/** Verde até 80%, laranja de 80% a 100%, vermelho acima de 100% (spec, seção 6). */
export function avaliarLimite(usadoMin: number, pedidoMin: number, limiteMin: number | null): AvaliacaoLimite {
  const totalMin = usadoMin + pedidoMin;
  if (limiteMin === null) return { faixa: 'sem-limite', totalMin, excessoMin: 0, percentual: null };
  const excessoMin = Math.max(0, totalMin - limiteMin);
  if (limiteMin <= 0) {
    return { faixa: totalMin > 0 ? 'excedido' : 'ok', totalMin, excessoMin, percentual: totalMin > 0 ? 100 : 0 };
  }
  const percentual = (totalMin / limiteMin) * 100;
  const faixa: Faixa = percentual > 100 ? 'excedido' : percentual > 80 ? 'atencao' : 'ok';
  return { faixa, totalMin, excessoMin, percentual };
}
