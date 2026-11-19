import { cn } from '@/lib/utils';
import type { AvaliacaoLimite, Faixa } from '../domain/limite';
import { formatarDuracao } from '../domain/horas';

const PREENCHIMENTO: Record<Exclude<Faixa, 'sem-limite'>, string> = {
  ok: 'bg-[var(--color-success-text)]',
  atencao: 'bg-[var(--color-brand)]',
  excedido: 'bg-[var(--color-danger)]',
};
const SELO: Record<Exclude<Faixa, 'sem-limite'>, string> = {
  ok: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  atencao: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  excedido: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]',
};

function textoDaFaixa(a: AvaliacaoLimite): string {
  if (a.faixa === 'ok') return 'Dentro do limite';
  if (a.faixa === 'atencao') return 'Perto do limite';
  return `Passa o limite em ${formatarDuracao(a.excessoMin)}, vai precisar de aprovação especial`;
}

// pedir ao @PhLima07: barra de limite (o sistema de design ainda não tem).
export function BarraLimite({ avaliacao, limiteMin }: { avaliacao: AvaliacaoLimite; limiteMin: number | null }) {
  if (avaliacao.faixa === 'sem-limite' || limiteMin === null) {
    return <p className="text-sm text-foreground">Sem limite de extensão</p>;
  }
  const faixa = avaliacao.faixa;
  const pct = Math.min(100, Math.max(0, Math.round(avaliacao.percentual ?? 0)));
  const uso = `${formatarDuracao(avaliacao.totalMin)} de ${formatarDuracao(limiteMin)}`;
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span id="rotulo-limite" className="font-semibold text-foreground">Limite do grupo</span>
        <span className="text-foreground">{uso}</span>
      </div>
      <div
        role="meter"
        aria-labelledby="rotulo-limite"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${uso}. ${textoDaFaixa(avaliacao)}`}
        className="h-2 overflow-hidden rounded-full bg-[var(--color-line)]"
      >
        <div className={cn('h-full rounded-full transition-[width] motion-reduce:transition-none', PREENCHIMENTO[faixa])} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn('w-fit max-w-full rounded-sm px-2 py-0.5 text-xs font-semibold', SELO[faixa])}>{textoDaFaixa(avaliacao)}</p>
    </div>
  );
}
