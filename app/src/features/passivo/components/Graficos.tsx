import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { emReais } from '../../../lib/conformidade';
import type { TotalPorSemana } from '../domain/radar';

const CARTAO = 'grid min-w-0 content-start gap-4 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]';
export const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const curto = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

export function Cartao({ titulo, descricao, children, className }: { titulo: string; descricao?: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn(CARTAO, className)}>
      <div className="grid gap-1">
        <h2 id={id} className="text-base font-bold text-foreground">{titulo}</h2>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

/** Largura proporcional ao maior valor; um valor pequeno ainda aparece. */
const largura = (valor: number, maior: number) => (valor <= 0 || maior <= 0 ? 0 : Math.max(2, Math.round((valor / maior) * 100)));

export interface ItemDeBarra {
  chave: string;
  nome: string;
  /** Segunda linha do nome (ex.: a base legal). */
  detalhe?: string;
  valor: number;
  aoClicar?: () => void;
}

/**
 * Uma linha por item: nome, barra e o valor em R$ escrito (a cor nunca é a única informação).
 * No celular o valor sobe para a linha do nome e a barra ocupa a largura toda.
 */
export function Barras({ rotulo, itens }: { rotulo: string; itens: ItemDeBarra[] }) {
  const maior = Math.max(0, ...itens.map((i) => i.valor));
  const grade = 'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_6.5rem]';
  return (
    <ul aria-label={rotulo} className="grid gap-2">
      {itens.map((i) => {
        const conteudo = (
          <>
            <span className="min-w-0 text-left text-foreground">
              <span className="block break-words">{i.nome}</span>
              {i.detalhe && <span className="block truncate text-xs text-muted-foreground">{i.detalhe}</span>}
            </span>
            <span aria-hidden="true" className="order-3 col-span-2 h-3 rounded-sm bg-[var(--color-neutral-bg)] md:order-none md:col-span-1">
              <span className="block h-full rounded-sm bg-[var(--color-brand)]" style={{ width: `${largura(i.valor, maior)}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-foreground">{emReais(i.valor, true)}</span>
          </>
        );
        return (
          <li key={i.chave}>
            {i.aoClicar ? (
              <button
                type="button"
                onClick={i.aoClicar}
                className={cn(grade, 'min-h-11 rounded-md px-1 py-1 outline-none hover:bg-[var(--color-row-hover)] focus-visible:ring-3 focus-visible:ring-ring md:min-h-9')}
              >
                {conteudo}
              </button>
            ) : (
              <div className={cn(grade, 'px-1 py-1')}>{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Colunas por semana (segunda a domingo). Cada coluna tem o valor escrito embaixo e o texto completo para leitor de tela. */
export function EvolucaoSemanal({ semanas }: { semanas: TotalPorSemana[] }) {
  const maior = Math.max(0, ...semanas.map((s) => s.custo));
  return (
    <div className="grid gap-2">
      <ol aria-label="Valor em risco por semana" className="grid h-40 grid-flow-col auto-cols-fr items-end gap-2 border-b border-[var(--color-line)]">
        {semanas.map((s) => (
          <li key={s.inicio} title={`Semana de ${ddmm(s.inicio)}: ${emReais(s.custo, true)} em risco`} className="flex h-full flex-col justify-end">
            <span className="sr-only">{`Semana de ${ddmm(s.inicio)}: ${emReais(s.custo, true)} em risco`}</span>
            <span aria-hidden="true" className="block w-full rounded-t-sm bg-[var(--color-brand)]" style={{ height: `${largura(s.custo, maior)}%` }} />
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="grid grid-flow-col auto-cols-fr gap-2 text-center text-xs text-muted-foreground tabular-nums">
        {semanas.map((s) => (
          <span key={s.inicio} className="grid min-w-0">
            <strong className="truncate font-semibold text-foreground">{curto.format(s.custo)}</strong>
            <span>{ddmm(s.inicio)}</span>
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Cada coluna é uma semana, começando na segunda-feira indicada.</p>
    </div>
  );
}
