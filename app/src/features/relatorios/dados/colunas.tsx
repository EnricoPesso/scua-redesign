import { Badge } from '@/components/ui/badge';
import type { ColunaRelatorio } from '@/modelos/relatorio';
import { formatarData, formatarDataHora } from './formatacao';

const valorDe = (row: object, chave: string): unknown => (row as Record<string, unknown>)[chave];

/** Coluna de data e hora em pt-BR (dd/mm/aaaa hh:mm); valor vazio vira "—". */
export function colunaDataHora<T extends object>(key: string, header: string): ColunaRelatorio<T> {
  const texto = (r: T) => { const v = valorDe(r, key); return typeof v === 'string' && v ? formatarDataHora(v) : '—'; };
  return { key, header, render: (r) => <span className="whitespace-nowrap tabular-nums">{texto(r)}</span>, texto };
}

/** Coluna só com a data (dd/mm/aaaa). */
export function colunaData<T extends object>(key: string, header: string): ColunaRelatorio<T> {
  const texto = (r: T) => { const v = valorDe(r, key); return typeof v === 'string' && v ? formatarData(v) : '—'; };
  return { key, header, render: (r) => <span className="whitespace-nowrap tabular-nums">{texto(r)}</span>, texto };
}

/** Texto que não quebra a linha (nome de estação, horário). Vazio vira "—". */
export function colunaSemQuebra<T extends object>(key: string, header: string): ColunaRelatorio<T> {
  const texto = (r: T) => String(valorDe(r, key) || '—');
  return { key, header, render: (r) => <span className="whitespace-nowrap">{texto(r)}</span>, texto };
}

/** Sim/Não com cor e texto. */
export function colunaSimNao<T extends object>(key: string, header: string): ColunaRelatorio<T> {
  const sim = (r: T) => Boolean(valorDe(r, key));
  return { key, header, render: (r) => <Badge status={sim(r) ? 'success' : 'neutral'}>{sim(r) ? 'Sim' : 'Não'}</Badge>, texto: (r) => (sim(r) ? 'Sim' : 'Não') };
}

/** Texto livre que pode estar vazio ("—"). */
export function colunaTexto<T extends object>(key: string, header: string): ColunaRelatorio<T> {
  const texto = (r: T) => String(valorDe(r, key) || '—');
  return { key, header, render: texto, texto };
}
