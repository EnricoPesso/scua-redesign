import { cn } from '@/lib/utils';
import { emHoras } from '../../../lib/conformidade';
import { ROTULO_NIVEL, SEMANA_CURTA, type DiaPrevisto, type Nivel } from '../domain/previsao';

/** Cor E símbolo E texto: o nível nunca depende só da cor. */
export const ESTILO_NIVEL: Record<Nivel, string> = {
  alto: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
  medio: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  baixo: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
};
export const SIMBOLO_NIVEL: Record<Nivel, string> = { alto: '▲', medio: '◆', baixo: '●' };
export const STATUS_BADGE: Record<Nivel, 'danger' | 'warning' | 'info'> = { alto: 'danger', medio: 'warning', baixo: 'info' };

function descricao(d: DiaPrevisto): string {
  const data = `${SEMANA_CURTA[d.diaDaSemana]} ${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}`;
  if (!d.util) return `${data}: sem jornada`;
  const extra = d.extraMin > 0 ? `, hora extra provável de ${emHoras(d.extraMin)}` : ', sem hora extra provável';
  return `${data}: ${d.nivel ? `risco ${ROTULO_NIVEL[d.nivel].toLowerCase()}` : 'sem risco'}${extra}`;
}

function Celula({ d }: { d: DiaPrevisto }) {
  const estilo = !d.util
    ? 'border border-dashed border-[var(--color-line)] text-muted-foreground'
    : d.nivel ? ESTILO_NIVEL[d.nivel] : 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral-text)]';
  return (
    <li className={cn('flex min-w-0 flex-col items-center gap-0.5 rounded-md px-0.5 py-1.5 text-center text-xs', estilo)}>
      <span className="sr-only">{descricao(d)}</span>
      <span aria-hidden="true" className="font-semibold">{SEMANA_CURTA[d.diaDaSemana]} {d.dia.slice(8, 10)}</span>
      <span aria-hidden="true" className="leading-none">{d.util ? (d.nivel ? SIMBOLO_NIVEL[d.nivel] : '✓') : '–'}</span>
      <span aria-hidden="true" className="max-w-full truncate font-semibold">{d.util ? (d.nivel ? ROTULO_NIVEL[d.nivel] : 'OK') : 'Folga'}</span>
      <span aria-hidden="true" className="tabular-nums">{d.util ? (d.extraMin > 0 ? `+${emHoras(d.extraMin)}` : '0') : ''}&nbsp;</span>
    </li>
  );
}

/** Uma célula por dia dos próximos 7: dia, símbolo, nível e hora extra provável. */
export function FaixaDeDias({ dias, rotulo }: { dias: DiaPrevisto[]; rotulo: string }) {
  return (
    <ol aria-label={rotulo} className="grid grid-cols-7 gap-1">
      {dias.map((d) => <Celula key={d.dia} d={d} />)}
    </ol>
  );
}
