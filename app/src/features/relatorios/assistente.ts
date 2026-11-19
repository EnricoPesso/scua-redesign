import type { AlvoRelatorio } from '../assistente/contrato';
import type { ConfigRelatorio, ValoresFiltro } from '@/modelos/relatorio';
import { formatNumber } from '@/lib/format-number';
import { formatarDataBr, lerLista, lerTexto, periodoDe } from '@/lib/relatorio';

/** Quantas linhas do relatório vão para a IA: só uma amostra, o total vai à parte. */
export const MAX_LINHAS_PARA_IA = 60;

/** Filtros aplicados em texto legível: o período como "de … a …" e nomes no lugar de ids. Filtro vazio não entra. */
function filtrosEmTexto<T>(config: ConfigRelatorio<T>, aplicados: ValoresFiltro): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const f of config.filtros) {
    if (f.tipo === 'periodo') {
      const p = periodoDe(aplicados);
      if (p) saida['Período'] = `de ${formatarDataBr(p.inicio)} a ${formatarDataBr(p.fim)}`;
    } else if (f.tipo === 'multi') {
      const nomes = lerLista(aplicados, f.chave).map((v) => f.opcoes.find((o) => o.value === v)?.label ?? v);
      if (nomes.length > 0) saida[f.rotulo] = nomes.join(', ');
    } else {
      const v = lerTexto(aplicados, f.chave);
      if (v) saida[f.rotulo] = f.tipo === 'select' ? (f.opcoes.find((o) => o.value === v)?.label ?? v) : v;
    }
  }
  return saida;
}

/**
 * O relatório aberto, já em texto, para o assistente analisar. As células usam o mesmo texto da exportação
 * (`coluna.texto`, ou o valor bruto do campo), nunca o JSX da tela.
 */
export function alvoDoRelatorio<T extends object>(config: ConfigRelatorio<T>, aplicados: ValoresFiltro, rows: T[]): AlvoRelatorio {
  return {
    tipo: 'relatorio',
    titulo: config.titulo,
    filtros: filtrosEmTexto(config, aplicados),
    indicadores: config.kpis.map((k) => ({ rotulo: k.rotulo, valor: formatNumber(k.valor(rows), k.decimais) + (k.unidade ? ` ${k.unidade}` : '') })),
    colunas: config.colunas.map((c) => c.header),
    linhas: rows.slice(0, MAX_LINHAS_PARA_IA).map((row) => config.colunas.map((c) => c.texto?.(row) ?? String(row[c.key as keyof T] ?? ''))),
    totalDeLinhas: rows.length,
  };
}
